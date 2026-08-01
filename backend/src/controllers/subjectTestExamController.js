const SubjectTestSubject = require('../models/SubjectTestSubject');
const SubjectTestTopic   = require('../models/SubjectTestTopic');
const SubjectTestQuestion= require('../models/SubjectTestQuestion');
const SubjectTest        = require('../models/SubjectTest');
const SubjectTestQuestionMap = require('../models/SubjectTestQuestionMap');
const SubjectTestInstruction = require('../models/SubjectTestInstruction');
const SubjectTestAttempt = require('../models/SubjectTestAttempt');
const UserSubscription  = require('../models/UserSubscription');

const mongoose = require('mongoose');

const isSubjectCategoryMatch = (sName, cName) => {
  if (!sName || !cName) return false;
  const s = String(sName).trim().toLowerCase();
  const c = String(cName).trim().toLowerCase();
  if (s === c) return true;
  if (s.includes('math') && c.includes('math')) return true;
  if ((s.includes('gk') || s.includes('general knowledge')) && (c.includes('gk') || c.includes('general knowledge'))) return true;
  if (s.includes('odia') && c.includes('odia')) return true;
  if (s.includes('eng') && c.includes('eng')) return true;
  if (s.includes('comp') && c.includes('comp')) return true;
  if (s.includes('reason') && c.includes('reason')) return true;
  return false;
};

// Helper: Ensure test.totalQuestions & SubjectTestQuestionMap are synced with Question Bank
const ensureTestQuestions = async (test) => {
  if (!test || !test._id) return 0;
  try {
    let mappedCount = await SubjectTestQuestionMap.countDocuments({ testId: test._id });
    if (mappedCount > 0) {
      if (test.totalQuestions !== mappedCount) {
        await SubjectTest.findByIdAndUpdate(test._id, {
          totalQuestions: mappedCount,
          totalMarks: mappedCount * (test.positiveMarks || 1)
        });
      }
      return mappedCount;
    }

    const Question = require('../models/Question');
    const Subject   = require('../models/Subject');
    const sId       = test.subjectId?._id || test.subjectId;
    const topicName = test.topicName || '';

    // --- 1. Try main Question Bank (Question model) by subject + topic ---
    let bankQs = [];
    if (sId && mongoose.Types.ObjectId.isValid(sId)) {
      const qFilter = { subject: sId };
      if (topicName) {
        qFilter.$or = [
          { topic: new RegExp(topicName.trim(), 'i') },
          { section: new RegExp(topicName.trim(), 'i') }
        ];
      }
      bankQs = await Question.find(qFilter).limit(50);
      // Fallback: all questions for the subject if no topic match
      if (bankQs.length === 0) {
        bankQs = await Question.find({ subject: sId }).limit(50);
      }
    }

    // --- 2. Fallback: try SubjectTestQuestion model ---
    if (bankQs.length === 0) {
      const orConditions = [];
      if (test.topicId && mongoose.Types.ObjectId.isValid(test.topicId)) {
        orConditions.push({ topicId: test.topicId });
      }
      if (sId && mongoose.Types.ObjectId.isValid(sId)) {
        orConditions.push({ subjectId: sId });
      }
      if (orConditions.length > 0) {
        const stQs = await SubjectTestQuestion.find({ status: { $ne: 'archived' }, $or: orConditions }).limit(50);
        if (stQs.length > 0) {
          // Map with default model tag for SubjectTestQuestion
          for (let i = 0; i < stQs.length; i++) {
            try {
              await SubjectTestQuestionMap.create({
                testId: test._id,
                questionId: stQs[i]._id,
                questionModel: 'SubjectTestQuestion',
                order: i + 1
              });
            } catch (dupErr) { /* skip duplicates */ }
          }
          mappedCount = stQs.length;
        }
      }
    } else {
      // Insert Question Bank questions with model tag
      for (let i = 0; i < bankQs.length; i++) {
        try {
          await SubjectTestQuestionMap.create({
            testId: test._id,
            questionId: bankQs[i]._id,
            questionModel: 'Question',
            order: i + 1
          });
        } catch (dupErr) { /* skip duplicates */ }
      }
      mappedCount = bankQs.length;
    }

    if (mappedCount > 0) {
      await SubjectTest.findByIdAndUpdate(test._id, {
        totalQuestions: mappedCount,
        totalMarks: mappedCount * (test.positiveMarks || 1)
      });
    }

    return mappedCount;
  } catch (err) {
    console.error('ensureTestQuestions error:', err);
    return test.totalQuestions || 0;
  }
};

/* ── Public 2-Level Tree (Categories -> Topics -> Tests) ─────────────────────── */
exports.getPublicSubjectTree = async (req, res, next) => {
  try {
    const categories = await SubjectTestSubject.find({ isActive: { $ne: false }, status: { $ne: 'inactive' } }).sort('displayOrder createdAt');

    const tree = await Promise.all(
      categories.map(async (cat) => {
        // Fetch all published tests
        const allPublished = await SubjectTest.find({ status: 'published' })
          .populate('categoryId', 'name color icon')
          .populate('subjectId', 'name color icon')
          .sort('createdAt');   // sort ascending so first created = first test

        // Filter tests belonging to this Subject Category
        const catTests = allPublished.filter(t => {
          if (t.subjectId?.name && isSubjectCategoryMatch(t.subjectId.name, cat.name)) return true;
          const tCatId = t.categoryId ? String(t.categoryId._id || t.categoryId) : null;
          if (tCatId && tCatId === String(cat._id)) return true;
          if (t.subjectId && String(t.subjectId._id || t.subjectId) === String(cat._id)) return true;
          return false;
        });

        // Sync question counts for all matching tests
        await Promise.all(catTests.map(t => ensureTestQuestions(t)));

        // The FIRST test in this category is always free (index 0 after ascending sort)
        const firstFreeTestId = catTests.length > 0 ? String(catTests[0]._id) : null;

        // Group tests under topics
        const topicMap = new Map();

        if (Array.isArray(cat.topics)) {
          cat.topics.forEach(tName => {
            const nameStr = typeof tName === 'string' ? tName : tName.name;
            if (nameStr) topicMap.set(nameStr, []);
          });
        }

        catTests.forEach(t => {
          const tName = t.topicName || 'General Practice';
          if (!topicMap.has(tName)) topicMap.set(tName, []);
          const isFreeTest = String(t._id) === firstFreeTestId;
          topicMap.get(tName).push({
            _id: t._id,
            title: t.title,
            qs: t.totalQuestions,
            mins: t.duration,
            marks: t.totalMarks,
            positiveMarks: t.positiveMarks,
            negativeMarks: t.negativeMarks,
            diff: t.difficulty,
            free: isFreeTest,                                      // strictly 1st test in category is free
            isFreeTest,                                      // explicit flag for UI
            categoryId: cat._id,                            // for purchase lookups on client
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
          categoryPrice: cat.price || 0,    // category subscription price
          firstFreeTestId,
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
    const { testId } = req.params;
    let test = await SubjectTest.findById(testId)
      .populate('subjectId', 'name color icon')
      .populate('topicId', 'name');

    if (!test) {
      const MockTest = require('../models/MockTest');
      const mockTest = await MockTest.findById(testId).populate('examination', 'name').populate('subject', 'name');
      if (mockTest) {
        const isFull = mockTest.testType === 'full_length' || (mockTest.totalMarks && mockTest.totalMarks >= 100);
        test = {
          _id: mockTest._id,
          title: mockTest.name || mockTest.title,
          description: mockTest.description,
          subjectId: { name: mockTest.subject?.name || mockTest.examination?.name || 'Mock Test' },
          topicId: { name: mockTest.topicName || (isFull ? 'Full Length Test' : 'Sectional Test') },
          totalQuestions: mockTest.questions?.length || mockTest.totalQuestions || (isFull ? 100 : 50),
          totalMarks: mockTest.totalMarks || (isFull ? 100 : 50),
          duration: mockTest.duration || (isFull ? 120 : 60),
          positiveMarks: mockTest.positiveMarks || 1,
          negativeMarks: mockTest.negativeMarks || 0.25,
          accessType: mockTest.accessType || (mockTest.price > 0 ? 'Premium' : 'Free'),
          availableLanguages: ['English', 'Odia'],
          allowLanguageChange: true,
          isMockTest: true
        };
      }
    }

    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    if (!test.isMockTest) {
      await ensureTestQuestions(test);
    }

    let instruction = await SubjectTestInstruction.findOne({ testId: test._id });
    if (!instruction) {
      instruction = {
        title: test.title,
        summary: test.description || 'Competitive Exam Mock Test',
        sections: [{ name: test.subjectId?.name || 'General Paper', questions: test.totalQuestions, marks: test.totalMarks, duration: test.duration, negativeMarking: test.negativeMarks }],
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
          availableLanguages: test.availableLanguages || ['English', 'Odia'],
          allowLanguageChange: test.allowLanguageChange !== false,
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

    let test = await SubjectTest.findById(testId);
    let isMockTest = false;

    if (!test) {
      const MockTest = require('../models/MockTest');
      const mockTest = await MockTest.findById(testId);
      if (mockTest) {
        const isFull = mockTest.testType === 'full_length' || (mockTest.totalMarks && mockTest.totalMarks >= 100);
        test = {
          _id: mockTest._id,
          title: mockTest.name || mockTest.title,
          status: 'published',
          duration: mockTest.duration || (isFull ? 120 : 60),
          positiveMarks: mockTest.positiveMarks || 1,
          negativeMarks: mockTest.negativeMarks || 0.25,
          accessType: mockTest.accessType || (mockTest.price > 0 ? 'Premium' : 'Free'),
          randomizeQuestions: mockTest.randomizeQuestions || false,
          isMockTest: true,
          mockTestObj: mockTest
        };
        isMockTest = true;
      }
    }

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

    // 2. Category-Based Access Gate (if not preview and not MockTest)
    if (!isPreview && !isMockTest) {
      const SubjectTestCategoryPurchase = require('../models/SubjectTestCategoryPurchase');

      // Resolve the category for this test
      const categoryId = test.categoryId || null;
      let category = null;
      if (categoryId) {
        category = await SubjectTestSubject.findById(categoryId).lean();
      }
      if (!category && test.subjectId) {
        // Try matching by subject name
        const subjectDoc = await require('../models/Subject').findById(test.subjectId).lean();
        if (subjectDoc) {
          category = await SubjectTestSubject.findOne({
            name: new RegExp(`^${subjectDoc.name.trim()}$`, 'i')
          }).lean();
        }
      }

      if (category && Number(category.price) > 0) {
        // Determine if this is the first (free) test in its category
        const firstTest = await SubjectTest.findOne({
          status: 'published',
          $or: [
            { categoryId: category._id },
            { subjectId: test.subjectId }
          ]
        }).sort('createdAt').lean();

        const isFirstFreeTest = firstTest && String(firstTest._id) === String(test._id);

        if (!isFirstFreeTest) {
          // Check if user has purchased this category
          const purchase = await SubjectTestCategoryPurchase.findOne({ userId, categoryId: category._id });
          if (!purchase) {
            return res.status(403).json({
              success: false,
              requiresCategoryPurchase: true,
              categoryId: category._id,
              categoryName: category.name,
              categoryPrice: category.price,
              message: `Purchase "${category.name}" category access (₹${category.price}) to attempt this test.`
            });
          }
        }
      }
    }

    // 3. Resolve questions
    let questions = [];

    if (isMockTest) {
      const Question = require('../models/Question');
      const mockObj = test.mockTestObj;
      if (mockObj.questions && mockObj.questions.length > 0) {
        questions = await Question.find({ _id: { $in: mockObj.questions } });
      }
      if (questions.length === 0 && mockObj.subject) {
        questions = await Question.find({ subject: mockObj.subject }).limit(50);
      }
      if (questions.length === 0) {
        questions = await Question.find({ status: { $ne: 'archived' } }).limit(50);
      }
    } else {
      const fetchAndPopulateMaps = async (tId) => {
        const rawMaps = await SubjectTestQuestionMap.find({ testId: tId }).sort('order');
        if (rawMaps.length === 0) return [];

        const Question = require('../models/Question');
        const allIds = rawMaps.map(m => m.questionId);

        const [bankDocs, stDocs] = await Promise.all([
          Question.find({ _id: { $in: allIds } }),
          SubjectTestQuestion.find({ _id: { $in: allIds } })
        ]);

        const docMap = new Map();
        [...stDocs, ...bankDocs].forEach(d => docMap.set(d._id.toString(), d));

        return rawMaps.map(m => ({
          ...m.toObject(),
          questionId: docMap.get(m.questionId.toString()) || null
        }));
      };

      let maps = await fetchAndPopulateMaps(testId);
      if (maps.length === 0) {
        await ensureTestQuestions(test);
        maps = await fetchAndPopulateMaps(testId);
      }
      maps = maps.filter(m => m.questionId != null);
      if (maps.length === 0) {
        return res.status(400).json({ success: false, message: 'This test has no questions assigned yet' });
      }
      questions = maps.map(m => m.questionId);
    }

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

    // 4. Normalize and prepare Exam-Safe Questions List (NO correctAnswer, NO explanation)
    // Options may come from either SubjectTestQuestion (uses o.id) or Question (uses o.label)
    const normalizeOptions = (rawOpts) => {
      if (!Array.isArray(rawOpts)) return [];
      return rawOpts.map(o => {
        const optId = o.id || o.label || '';   // SubjectTestQuestion: o.id  |  Question: o.label
        return { id: optId, text: o.text || '', image: o.image || '' };
      });
    };

    const examQuestions = questions.map((q, idx) => {
      let opts = normalizeOptions(q.options);
      if (test.randomizeOptions) {
        opts = [...opts].sort(() => Math.random() - 0.5);
      }
      return {
        _id: q._id,
        index: idx + 1,
        questionText: q.questionText,
        questionImage: q.questionImage,
        questionType: q.questionType || 'single_correct',
        options: opts,
        marks: q.defaultMarks || q.marks || test.positiveMarks || 1,
        negativeMarks: q.defaultNegativeMarks || q.negativeMarks || test.negativeMarks || 0.25,
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
    const attempt = await SubjectTestAttempt.findById(attemptId);

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to attempt' });
    }

    const now = new Date();
    // Auto-expire check
    if (now > attempt.expiryTime && attempt.status === 'in_progress') {
      return exports.submitAttemptInternal(attempt, res);
    }

    let test = await SubjectTest.findById(attempt.testId);
    if (!test) {
      const MockTest = require('../models/MockTest');
      const mockTest = await MockTest.findById(attempt.testId);
      if (mockTest) {
        test = {
          _id: mockTest._id,
          title: mockTest.name || mockTest.title,
          positiveMarks: mockTest.positiveMarks || 1,
          negativeMarks: mockTest.negativeMarks || 0.25,
          isMockTest: true
        };
      }
    }

    const Question = require('../models/Question');
    const qOrderIds = (attempt.questionOrder || []).map(id => String(id));
    const [bankDocs, stDocs] = await Promise.all([
      Question.find({ _id: { $in: qOrderIds } }),
      SubjectTestQuestion.find({ _id: { $in: qOrderIds } })
    ]);
    const docMapG = new Map();
    [...stDocs, ...bankDocs].forEach(d => docMapG.set(d._id.toString(), d));

    let questionsList = qOrderIds.map(id => docMapG.get(id)).filter(Boolean);
    if (questionsList.length === 0) {
      questionsList = await Question.find({ status: { $ne: 'archived' } }).limit(50);
    }

    const normalizeOptions = (rawOpts) => {
      if (!Array.isArray(rawOpts)) return [];
      return rawOpts.map((o, idx) => {
        const optLabel = o.label || String.fromCharCode(65 + idx);
        const optId = o.id || o._id || optLabel;
        return { id: optId, label: optLabel, text: o.text || '', image: o.image || '' };
      });
    };

    const examQuestions = questionsList.map((q, idx) => ({
      _id: q._id,
      index: idx + 1,
      questionText: q.questionText,
      questionImage: q.questionImage,
      questionType: q.questionType || 'single_correct',
      options: normalizeOptions(q.options),
      marks: q.defaultMarks || q.marks || test?.positiveMarks || 1,
      negativeMarks: q.defaultNegativeMarks || q.negativeMarks || test?.negativeMarks || 0.25,
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
      attempt.markModified('answers');
    }

    if (status) {
      attempt.questionStates.set(questionId, status);
      attempt.markModified('questionStates');
    }

    await attempt.save();
    res.json({ success: true, answers: attempt.answers, questionStates: attempt.questionStates });
  } catch (err) { next(err); }
};

const checkAnswerMatch = (userAns, q) => {
  if (userAns === undefined || userAns === null || userAns === '' || !q || !q.correctAnswer) return false;

  const uStr = String(userAns).trim().toLowerCase();
  const cStr = String(q.correctAnswer).trim().toLowerCase();

  // 1. Direct match
  if (uStr === cStr) return true;

  const letterMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'option_a': 0, 'option_b': 1, 'option_c': 2, 'option_d': 3 };

  // Helper to find option index for any value (ID, label, index, text)
  const findOptionIndex = (valStr) => {
    if (!valStr) return -1;
    let idxFromLetter = letterMap[valStr];
    if (idxFromLetter !== undefined) return idxFromLetter;

    if (!isNaN(parseInt(valStr, 10)) && parseInt(valStr, 10) >= 0 && parseInt(valStr, 10) < 10) {
      return parseInt(valStr, 10);
    }

    if (Array.isArray(q.options) && q.options.length > 0) {
      const foundIdx = q.options.findIndex((opt, idx) => {
        const optId = String(opt.id || opt._id || '').trim().toLowerCase();
        const optLabel = String(opt.label || String.fromCharCode(65 + idx)).trim().toLowerCase();
        const optText = String(opt.text || '').trim().toLowerCase();
        return (
          optId === valStr ||
          optLabel === valStr ||
          (optText !== '' && optText === valStr)
        );
      });
      if (foundIdx !== -1) return foundIdx;
    }

    return -1;
  };

  const userIdx = findOptionIndex(uStr);
  const correctIdx = findOptionIndex(cStr);

  if (userIdx !== -1 && correctIdx !== -1 && userIdx === correctIdx) {
    return true;
  }

  return false;
};

const getUserAnswer = (answersMapOrObj, qStr) => {
  if (!answersMapOrObj) return null;
  const targetKey = String(qStr);

  if (typeof answersMapOrObj.get === 'function') {
    let val = answersMapOrObj.get(targetKey);
    if (val !== undefined && val !== null && val !== '') return val;
    for (const [k, v] of answersMapOrObj.entries()) {
      if (String(k) === targetKey && v !== undefined && v !== null && v !== '') return v;
    }
  }

  if (typeof answersMapOrObj === 'object') {
    if (answersMapOrObj[targetKey] !== undefined && answersMapOrObj[targetKey] !== null && answersMapOrObj[targetKey] !== '') {
      return answersMapOrObj[targetKey];
    }
    for (const k of Object.keys(answersMapOrObj)) {
      if (String(k) === targetKey) {
        const v = answersMapOrObj[k];
        if (v !== undefined && v !== null && v !== '') return v;
      }
    }
  }

  return null;
};

/* ── Submit Attempt Internal Helper ────────────────────────────────────────── */
exports.submitAttemptInternal = async (attempt, res) => {
  try {
    if (attempt.status === 'completed') {
      return res.json({ success: true, message: 'Attempt already completed', attemptId: attempt._id });
    }

    const test = await SubjectTest.findById(attempt.testId);

    // Fetch questions from SubjectTestQuestionMap to support both Question and SubjectTestQuestion models
    const Question = require('../models/Question');
    const maps = await SubjectTestQuestionMap.find({ testId: attempt.testId }).populate('questionId');
    const questionMap = new Map();
    maps.forEach(m => {
      if (m.questionId) questionMap.set(m.questionId._id.toString(), m.questionId);
    });
    // Also fallback: try fetching by IDs from both collections for any unmapped
    const attemptQIds = (attempt.questionOrder || []).map(id => id.toString());
    const alreadyMapped = new Set(questionMap.keys());
    const unmappedIds = attemptQIds.filter(id => !alreadyMapped.has(id));
    if (unmappedIds.length > 0) {
      const [stQs, bankQs] = await Promise.all([
        SubjectTestQuestion.find({ _id: { $in: unmappedIds } }),
        Question.find({ _id: { $in: unmappedIds } })
      ]);
      [...stQs, ...bankQs].forEach(q => questionMap.set(q._id.toString(), q));
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let positiveTotal = 0;
    let negativeTotal = 0;

    attempt.questionOrder.forEach(qId => {
      const qStr = qId.toString();
      const q = questionMap.get(qStr);
      const userAns = getUserAnswer(attempt.answers, qStr);

      const posMark = (q && typeof q.defaultMarks === 'number' && q.defaultMarks > 0) ? q.defaultMarks : ((q && typeof q.marks === 'number' && q.marks > 0) ? q.marks : (test && test.positiveMarks ? test.positiveMarks : 1));
      const negMark = (q && typeof q.defaultNegativeMarks === 'number' && q.defaultNegativeMarks > 0) ? q.defaultNegativeMarks : ((q && typeof q.negativeMarks === 'number' && q.negativeMarks > 0) ? q.negativeMarks : (test && test.negativeMarks ? test.negativeMarks : 0.25));

      if (!userAns) {
        skippedCount++;
      } else if (q && checkAnswerMatch(userAns, q)) {
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

    // Broadcast real-time Socket.IO event
    try {
      const { emitEvent } = require('../utils/socket');
      emitEvent('attempt_submitted', {
        attemptId: attempt._id,
        testId: attempt.testId,
        score: attempt.score,
        totalMarks: totalMaxMarks,
        correctCount,
        incorrectCount,
        percentage,
        rank,
        totalTakers,
        percentile
      });
    } catch { /* proceed */ }

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

    // Fail-safe: merge any client-submitted answers directly into attempt.answers map
    if (req.body && req.body.answers && typeof req.body.answers === 'object') {
      Object.entries(req.body.answers).forEach(([qId, opt]) => {
        if (opt) attempt.answers.set(qId, opt);
      });
      attempt.markModified('answers');
    }
    if (req.body && req.body.questionStates && typeof req.body.questionStates === 'object') {
      Object.entries(req.body.questionStates).forEach(([qId, st]) => {
        if (st) attempt.questionStates.set(qId, st);
      });
      attempt.markModified('questionStates');
    }
    await attempt.save();

    return exports.submitAttemptInternal(attempt, res);
  } catch (err) { next(err); }
};

/* ── Get Result & Detailed Solutions Analytics ─────────────────────────────── */
exports.getExamAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await SubjectTestAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to result' });
    }

    let test = await SubjectTest.findById(attempt.testId).select('title positiveMarks negativeMarks');
    if (!test) {
      const MockTest = require('../models/MockTest');
      const mockTest = await MockTest.findById(attempt.testId);
      if (mockTest) {
        test = {
          title: mockTest.name || mockTest.title,
          positiveMarks: mockTest.positiveMarks || 1,
          negativeMarks: mockTest.negativeMarks || 0.25
        };
      }
    }

    // Fetch questions mapped to questionOrder
    const Question = require('../models/Question');
    const qOrderIds = (attempt.questionOrder || []).map(id => String(id));
    const [bankDocs, stDocs] = await Promise.all([
      Question.find({ _id: { $in: qOrderIds } }),
      SubjectTestQuestion.find({ _id: { $in: qOrderIds } })
    ]);
    const docMap = new Map();
    [...stDocs, ...bankDocs].forEach(d => docMap.set(d._id.toString(), d));

    let questionsList = qOrderIds.map(id => docMap.get(id)).filter(Boolean);
    if (questionsList.length === 0) {
      questionsList = await Question.find({ status: { $ne: 'archived' } }).limit(50);
    }

    const normalizeOptions = (rawOpts) => {
      if (!Array.isArray(rawOpts)) return [];
      return rawOpts.map((o, idx) => {
        const optLabel = o.label || String.fromCharCode(65 + idx);
        const optId = o.id || o._id || optLabel;
        return { id: optId, label: optLabel, text: o.text || '', image: o.image || '' };
      });
    };

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let positiveTotal = 0;
    let negativeTotal = 0;

    const solutions = questionsList.map((q, idx) => {
      const qStr = q._id.toString();
      const userAns = getUserAnswer(attempt.answers, qStr);
      const isCorrect = userAns ? checkAnswerMatch(userAns, q) : false;
      const isSkipped = !userAns;

      const posMark = (q && typeof q.defaultMarks === 'number' && q.defaultMarks > 0) ? q.defaultMarks : ((q && typeof q.marks === 'number' && q.marks > 0) ? q.marks : (test && test.positiveMarks ? test.positiveMarks : 1));
      const negMark = (q && typeof q.defaultNegativeMarks === 'number' && q.defaultNegativeMarks > 0) ? q.defaultNegativeMarks : ((q && typeof q.negativeMarks === 'number' && q.negativeMarks > 0) ? q.negativeMarks : (test && test.negativeMarks ? test.negativeMarks : 0.25));

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
        positiveTotal += posMark;
      } else {
        incorrectCount++;
        negativeTotal += negMark;
      }

      return {
        _id: q._id,
        index: idx + 1,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: normalizeOptions(q.options),
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        isCorrect,
        isSkipped,
        marks: isCorrect ? posMark : (isSkipped ? 0 : -negMark)
      };
    });

    const totalQs = attempt.questionOrder?.length || questionsList.length;
    const totalMaxMarks = totalQs * (test?.positiveMarks || 1);
    const realScore = Math.max(0, parseFloat((positiveTotal - negativeTotal).toFixed(2)));
    const percentage = totalMaxMarks > 0 ? parseFloat(((realScore / totalMaxMarks) * 100).toFixed(2)) : 0;
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? parseFloat(((correctCount / attemptedCount) * 100).toFixed(2)) : 0;

    // Auto-heal attempt record in MongoDB if score/counts were outdated
    if (attempt.score !== realScore || attempt.correctCount !== correctCount) {
      attempt.score = realScore;
      attempt.correctCount = correctCount;
      attempt.incorrectCount = incorrectCount;
      attempt.skippedCount = skippedCount;
      attempt.positiveMarksTotal = parseFloat(positiveTotal.toFixed(2));
      attempt.negativeMarksTotal = parseFloat(negativeTotal.toFixed(2));
      attempt.percentage = percentage;
      attempt.accuracy = accuracy;
      await attempt.save().catch(() => {});
    }

    const User = require('../models/User');
    const userDoc = await User.findById(attempt.userId).select('name');
    const userName = userDoc?.name || req.user?.name || 'Student Candidate';

    // Calculate live rank and percentile
    const allCompleted = await SubjectTestAttempt.find({ testId: attempt.testId, status: 'completed' })
      .select('score')
      .sort('-score updatedAt');
    
    const totalTakers = Math.max(1, allCompleted.length);
    let rank = 1;
    let betterThanCount = 0;
    allCompleted.forEach((att, idx) => {
      if (att._id.toString() === attempt._id.toString()) {
        rank = idx + 1;
      }
      if (att.score < realScore) {
        betterThanCount++;
      }
    });

    const percentile = totalTakers > 1 
      ? parseFloat(((betterThanCount / (totalTakers - 1)) * 100).toFixed(1)) 
      : 100;

    res.json({
      success: true,
      data: {
        testTitle: test?.title || 'Competitive Exam Practice Test',
        attemptId: attempt._id,
        userName,
        status: attempt.status,
        score: attempt.score,
        totalMarks: totalMaxMarks,
        percentage: attempt.percentage,
        accuracy: attempt.accuracy,
        rank,
        totalTakers,
        percentile,
        totalQuestions: totalQs,
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

/* ── Get Logged-in Student Attended Exams History ───────────────────────────── */
exports.getMyAttempts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const attempts = await SubjectTestAttempt.find({ userId, status: 'completed' })
      .sort('-updatedAt')
      .limit(100);

    const testIds = attempts.map(a => a.testId);
    const [bankTests, mockTests] = await Promise.all([
      SubjectTest.find({ _id: { $in: testIds } }).select('title positiveMarks negativeMarks subjectId'),
      require('../models/MockTest').find({ _id: { $in: testIds } }).select('name title positiveMarks negativeMarks examination')
    ]);

    const testMap = new Map();
    bankTests.forEach(t => testMap.set(t._id.toString(), { name: t.title, category: 'Subject Test' }));
    mockTests.forEach(m => testMap.set(m._id.toString(), { name: m.name || m.title, category: 'Mock Test' }));

    const formatted = attempts.map((a, i) => {
      const tInfo = testMap.get(a.testId.toString()) || { name: 'Practice Test', category: 'Competitive Exam' };
      const dateObj = new Date(a.updatedAt || a.createdAt);
      const totalMaxMarks = (a.questionOrder?.length || 100) * 1;
      return {
        _id: a._id,
        attemptId: a._id,
        name: tInfo.name,
        category: tInfo.category,
        date: dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        score: a.score || 0,
        marks: `${a.score || 0} / ${totalMaxMarks}`,
        maxMarks: totalMaxMarks,
        accuracy: `${a.accuracy || 0}%`,
        percentile: `${a.percentage || 0}%ile`,
        correct: a.correctCount || 0,
        wrong: a.incorrectCount || 0,
        unattempted: a.skippedCount || 0,
        rank: `#${i + 1}`,
        status: 'COMPLETED'
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
};
