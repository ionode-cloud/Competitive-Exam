const SubjectTestSubject = require('../models/SubjectTestSubject');
const SubjectTestTopic   = require('../models/SubjectTestTopic');
const SubjectTestQuestion= require('../models/SubjectTestQuestion');
const SubjectTest        = require('../models/SubjectTest');
const SubjectTestQuestionMap = require('../models/SubjectTestQuestionMap');
const SubjectTestInstruction = require('../models/SubjectTestInstruction');
const SubjectTestAttempt = require('../models/SubjectTestAttempt');
const UserSubscription  = require('../models/UserSubscription');

/* ── Public 2-Level Tree (Categories -> Topics -> Tests) ─────────────────────── */
exports.getPublicSubjectTree = async (req, res, next) => {
  try {
    const categories = await SubjectTestSubject.find({ isActive: true }).sort('displayOrder createdAt');

    const tree = await Promise.all(
      categories.map(async (cat) => {
        // Fetch all published tests
        const allPublished = await SubjectTest.find({ status: 'published' })
          .populate('subjectId', 'name color icon')
          .sort('-createdAt');

        // Filter tests belonging to this Subject Test Category
        const catTests = allPublished.filter(t => {
          if (t.categoryId && String(t.categoryId) === String(cat._id)) return true;
          if (t.subjectId && String(t.subjectId._id || t.subjectId) === String(cat._id)) return true;
          if (t.subjectId?.name && t.subjectId.name.toLowerCase() === cat.name.toLowerCase()) return true;
          return false;
        });

        // Group tests under topics
        const topicMap = new Map();

        // Initialize predefined category topics if available
        if (Array.isArray(cat.topics)) {
          cat.topics.forEach(tName => {
            const nameStr = typeof tName === 'string' ? tName : tName.name;
            if (nameStr) topicMap.set(nameStr, []);
          });
        }

        catTests.forEach(t => {
          const tName = t.topicName || 'General Practice';
          if (!topicMap.has(tName)) {
            topicMap.set(tName, []);
          }
          topicMap.get(tName).push({
            _id: t._id,
            title: t.title,
            qs: t.totalQuestions,
            mins: t.duration,
            marks: t.totalMarks,
            positiveMarks: t.positiveMarks,
            negativeMarks: t.negativeMarks,
            diff: t.difficulty,
            free: t.accessType === 'Free',
            accessType: t.accessType,
            price: t.price || 49,
            status: t.status,
          });
        });

        const topicsArray = Array.from(topicMap.entries()).map(([tName, tList]) => ({
          _id: tName,
          name: tName,
          tests: tList
        }));

        return {
          _id: cat._id,
          name: cat.name,
          code: cat.code,
          color: cat.color,
          bg: cat.bg,
          icon: cat.icon,
          desc: cat.description,
          topics: topicsArray
        };
      })
    );

    res.json({ success: true, data: tree });
  } catch (err) { next(err); }
};

/* ── Test Instructions Loader ──────────────────────────────────────────────── */
exports.getTestInstructions = async (req, res, next) => {
  try {
    const test = await SubjectTest.findById(req.params.testId)
      .populate('subjectId', 'name color icon')
      .populate('topicId', 'name');

    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    let instruction = await SubjectTestInstruction.findOne({ testId: test._id });
    if (!instruction) {
      instruction = {
        title: test.title,
        summary: test.description || 'Subject Practice Test',
        sections: [{ name: test.subjectId?.name || 'Subject Test', questions: test.totalQuestions, marks: test.totalMarks, duration: test.duration, negativeMarking: test.negativeMarks }],
        instructions: [
          `You have ${test.duration} minutes to complete the test.`,
          `The test contains ${test.totalQuestions} questions.`,
          'There is only one correct answer to each question.',
          `You will be awarded +${test.positiveMarks} marks for correct answer, -${test.negativeMarks} for wrong answer.`,
          'You can change answers or clear responses anytime before submitting.',
          'When timer reaches 00:00, test will auto submit.'
        ],
        agreementText: 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.'
      };
    }

    res.json({
      success: true,
      data: {
        test: {
          _id: test._id,
          title: test.title,
          subjectName: test.subjectId?.name,
          topicName: test.topicId?.name,
          totalQuestions: test.totalQuestions,
          totalMarks: test.totalMarks,
          duration: test.duration,
          positiveMarks: test.positiveMarks,
          negativeMarks: test.negativeMarks,
          accessType: test.accessType,
          availableLanguages: test.availableLanguages,
          allowLanguageChange: test.allowLanguageChange,
        },
        instruction
      }
    });
  } catch (err) { next(err); }
};

/* ── Start Exam Attempt ─────────────────────────────────────────────────────── */
exports.startExamAttempt = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { selectedLanguage = 'en', isPreview = false } = req.body;
    const userId = req.user._id;

    const test = await SubjectTest.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'published' && !isPreview) {
      return res.status(400).json({ success: false, message: 'This test is currently not published' });
    }

    // 1. Premium Access Check (if not preview)
    if (test.accessType === 'Premium' && !isPreview) {
      const activeSub = await UserSubscription.findOne({
        userId,
        status: 'active',
        endDate: { $gte: new Date() }
      });
      if (!activeSub) {
        return res.status(403).json({
          success: false,
          requiresSubscription: true,
          message: 'This is a Premium Test. Please subscribe to attempt.'
        });
      }
    }

    // 2. Fetch mapped questions
    const maps = await SubjectTestQuestionMap.find({ testId })
      .populate('questionId')
      .sort('order');

    if (maps.length === 0) {
      return res.status(400).json({ success: false, message: 'This test has no questions assigned yet' });
    }

    let questions = maps.map(m => m.questionId);

    // Randomize questions if test setting enabled
    if (test.randomizeQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // 3. Create Attempt Record
    const startTime = new Date();
    const expiryTime = new Date(startTime.getTime() + (test.duration * 60 * 1000));
    const questionOrder = questions.map(q => q._id);

    // Initialize questionStates
    const questionStates = {};
    questionOrder.forEach(id => {
      questionStates[id.toString()] = 'NOT_VISITED';
    });

    const attempt = await SubjectTestAttempt.create({
      userId,
      testId,
      startTime,
      expiryTime,
      durationMins: test.duration,
      selectedLanguage,
      status: 'in_progress',
      questionOrder,
      questionStates,
      answers: {},
      isPreview: !!isPreview,
    });

    // 4. Prepare Exam-Safe Questions List (NO correctAnswer, NO explanation)
    const examQuestions = questions.map((q, idx) => {
      let opts = q.options;
      if (test.randomizeOptions) {
        opts = [...opts].sort(() => Math.random() - 0.5);
      }
      return {
        _id: q._id,
        index: idx + 1,
        questionText: q.questionText,
        questionImage: q.questionImage,
        questionType: q.questionType,
        options: opts.map(o => ({ id: o.id, text: o.text, image: o.image })),
        marks: q.defaultMarks || test.positiveMarks || 1,
        negativeMarks: q.defaultNegativeMarks || test.negativeMarks || 0.25,
      };
    });

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        testTitle: test.title,
        startTime: attempt.startTime,
        expiryTime: attempt.expiryTime,
        durationMins: test.duration,
        selectedLanguage: attempt.selectedLanguage,
        totalQuestions: examQuestions.length,
        questions: examQuestions,
        answers: attempt.answers,
        questionStates: attempt.questionStates,
      }
    });
  } catch (err) { next(err); }
};

/* ── Get Active Attempt (for Refresh / Resume) ─────────────────────────────── */
exports.getExamAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await SubjectTestAttempt.findById(attemptId).populate({
      path: 'questionOrder',
      select: '-correctAnswer -explanation'
    });

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to attempt' });
    }

    const now = new Date();
    // Auto-expire check
    if (now > attempt.expiryTime && attempt.status === 'in_progress') {
      return exports.submitAttemptInternal(attempt, res);
    }

    const test = await SubjectTest.findById(attempt.testId);

    const examQuestions = attempt.questionOrder.map((q, idx) => ({
      _id: q._id,
      index: idx + 1,
      questionText: q.questionText,
      questionImage: q.questionImage,
      questionType: q.questionType,
      options: q.options,
      marks: q.defaultMarks || test?.positiveMarks || 1,
      negativeMarks: q.defaultNegativeMarks || test?.negativeMarks || 0.25,
    }));

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        testTitle: test?.title,
        status: attempt.status,
        startTime: attempt.startTime,
        expiryTime: attempt.expiryTime,
        durationMins: attempt.durationMins,
        selectedLanguage: attempt.selectedLanguage,
        totalQuestions: examQuestions.length,
        questions: examQuestions,
        answers: attempt.answers,
        questionStates: attempt.questionStates,
      }
    });
  } catch (err) { next(err); }
};

/* ── Save Answer / Update State ─────────────────────────────────────────────── */
exports.saveAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption, status } = req.body; // status: 'ANSWERED' | 'MARKED' | 'ANSWERED_MARKED' | 'NOT_ANSWERED'

    const attempt = await SubjectTestAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Attempt is already completed or expired' });
    }

    // Verify time limit
    if (new Date() > attempt.expiryTime) {
      return exports.submitAttemptInternal(attempt, res);
    }

    if (selectedOption !== undefined) {
      if (selectedOption === null || selectedOption === '') {
        attempt.answers.delete(questionId);
      } else {
        attempt.answers.set(questionId, selectedOption);
      }
    }

    if (status) {
      attempt.questionStates.set(questionId, status);
    }

    await attempt.save();
    res.json({ success: true, answers: attempt.answers, questionStates: attempt.questionStates });
  } catch (err) { next(err); }
};

/* ── Submit Attempt Internal Helper ────────────────────────────────────────── */
exports.submitAttemptInternal = async (attempt, res) => {
  try {
    if (attempt.status === 'completed') {
      return res.json({ success: true, message: 'Attempt already completed', attemptId: attempt._id });
    }

    const test = await SubjectTest.findById(attempt.testId);
    const questions = await SubjectTestQuestion.find({ _id: { $in: attempt.questionOrder } });
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let positiveTotal = 0;
    let negativeTotal = 0;

    attempt.questionOrder.forEach(qId => {
      const qStr = qId.toString();
      const q = questionMap.get(qStr);
      const userAns = attempt.answers.get(qStr);

      const posMark = q?.defaultMarks || test?.positiveMarks || 1;
      const negMark = q?.defaultNegativeMarks || test?.negativeMarks || 0.25;

      if (!userAns) {
        skippedCount++;
      } else if (q && userAns === q.correctAnswer) {
        correctCount++;
        positiveTotal += posMark;
      } else {
        incorrectCount++;
        negativeTotal += negMark;
      }
    });

    const finalScore = Math.max(0, positiveTotal - negativeTotal);
    const totalQuestions = attempt.questionOrder.length;
    const totalMaxMarks = totalQuestions * (test?.positiveMarks || 1);
    const percentage = totalMaxMarks > 0 ? (finalScore / totalMaxMarks) * 100 : 0;
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    const now = new Date();
    const timeTakenSec = Math.round((now.getTime() - new Date(attempt.startTime).getTime()) / 1000);

    attempt.status = 'completed';
    attempt.endTime = now;
    attempt.score = parseFloat(finalScore.toFixed(2));
    attempt.percentage = parseFloat(percentage.toFixed(2));
    attempt.accuracy = parseFloat(accuracy.toFixed(2));
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.skippedCount = skippedCount;
    attempt.positiveMarksTotal = parseFloat(positiveTotal.toFixed(2));
    attempt.negativeMarksTotal = parseFloat(negativeTotal.toFixed(2));
    attempt.timeTakenSec = Math.min(timeTakenSec, attempt.durationMins * 60);

    await attempt.save();

    return res.json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attemptId: attempt._id,
        score: attempt.score,
        percentage: attempt.percentage,
        accuracy: attempt.accuracy,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        skippedCount: attempt.skippedCount,
        positiveMarksTotal: attempt.positiveMarksTotal,
        negativeMarksTotal: attempt.negativeMarksTotal,
        timeTakenSec: attempt.timeTakenSec,
      }
    });
  } catch (err) {
    if (res && !res.headersSent) res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Submit Endpoint ────────────────────────────────────────────────────────── */
exports.submitExamAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await SubjectTestAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    return exports.submitAttemptInternal(attempt, res);
  } catch (err) { next(err); }
};

/* ── Get Result & Detailed Solutions Analytics ─────────────────────────────── */
exports.getExamAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await SubjectTestAttempt.findById(attemptId)
      .populate({ path: 'testId', select: 'title positiveMarks negativeMarks resultSettings' })
      .populate('questionOrder');

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to result' });
    }

    const test = attempt.testId;
    const resultSettings = test?.resultSettings || {};

    // Prepare Detailed Questions Analysis (if settings allow)
    let solutions = [];
    if (resultSettings.showSolutions || req.user.role === 'admin') {
      solutions = attempt.questionOrder.map((q, idx) => {
        const qStr = q._id.toString();
        const userAns = attempt.answers.get(qStr) || null;
        const isCorrect = userAns === q.correctAnswer;
        const isSkipped = !userAns;

        return {
          _id: q._id,
          index: idx + 1,
          questionText: q.questionText,
          questionImage: q.questionImage,
          options: q.options,
          userAnswer: userAns,
          correctAnswer: resultSettings.showCorrectAnswers !== false ? q.correctAnswer : null,
          explanation: resultSettings.showExplanation !== false ? q.explanation : null,
          isCorrect,
          isSkipped,
          marks: isCorrect ? (q.defaultMarks || test.positiveMarks || 1) : (isSkipped ? 0 : -(q.defaultNegativeMarks || test.negativeMarks || 0.25))
        };
      });
    }

    res.json({
      success: true,
      data: {
        testTitle: test?.title,
        attemptId: attempt._id,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.questionOrder.length * (test?.positiveMarks || 1),
        percentage: attempt.percentage,
        accuracy: attempt.accuracy,
        totalQuestions: attempt.questionOrder.length,
        attempted: attempt.correctCount + attempt.incorrectCount,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        skippedCount: attempt.skippedCount,
        positiveMarksTotal: attempt.positiveMarksTotal,
        negativeMarksTotal: attempt.negativeMarksTotal,
        timeTakenSec: attempt.timeTakenSec,
        solutions
      }
    });
  } catch (err) { next(err); }
};
