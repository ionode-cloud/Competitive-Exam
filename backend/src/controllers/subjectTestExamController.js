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

/* ── Public Hierarchy Tree (Category -> Subject -> Topic -> Tests) ───────────── */
exports.getPublicSubjectTree = async (req, res, next) => {
  try {
    const categories = await SubjectTestSubject.find({ isActive: { $ne: false }, status: { $ne: 'inactive' } }).sort('displayOrder createdAt');

    const tree = await Promise.all(
      categories.map(async (cat) => {
        // Fetch all published tests
        const allPublished = await SubjectTest.find({ status: 'published' })
          .populate('categoryId', 'name color icon')
          .populate('subjectId', 'name color icon')
          .populate('topicId', 'name')
          .sort('createdAt');   // sort ascending so first created = first test

        // Filter tests belonging to this Subject Category
        const catTests = allPublished.filter(t => {
          const tCatId = t.categoryId ? String(t.categoryId._id || t.categoryId) : null;
          if (tCatId && tCatId === String(cat._id)) return true;
          if (t.subjectId?.name && isSubjectCategoryMatch(t.subjectId.name, cat.name)) return true;
          if (t.subjectId && String(t.subjectId._id || t.subjectId) === String(cat._id)) return true;
          return false;
        });

        // Sync question counts for all matching tests
        await Promise.all(catTests.map(t => ensureTestQuestions(t)));

        // The FIRST test in this category is always free (index 0 after ascending sort)
        const firstFreeTestId = catTests.length > 0 ? String(catTests[0]._id) : null;

        // Group tests strictly by Subject -> Topic -> Test
        const subjectsMap = new Map();

        catTests.forEach(t => {
          const subjObj = (t.subjectId && typeof t.subjectId === 'object') ? t.subjectId : null;
          const sId = subjObj?._id ? String(subjObj._id) : (t.subjectId ? String(t.subjectId) : String(cat._id));
          const sName = subjObj?.name || cat.name || 'General Subject';

          if (!subjectsMap.has(sId)) {
            subjectsMap.set(sId, {
              _id: sId,
              name: sName,
              topicsMap: new Map()
            });
          }

          const subjData = subjectsMap.get(sId);
          const tName = t.topicName || (t.topicId?.name) || 'General Practice';
          const tId = t.topicId?._id ? String(t.topicId._id) : (t.topicId ? String(t.topicId) : tName);

          if (!subjData.topicsMap.has(tName)) {
            subjData.topicsMap.set(tName, {
              _id: tId,
              name: tName,
              tests: []
            });
          }

          const isFreeTest = String(t._id) === firstFreeTestId;
          subjData.topicsMap.get(tName).tests.push({
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
            subjectId: sId,
            topicName: tName,
            accessType: t.accessType,
            price: t.price || 49,
            status: t.status,
          });
        });

        const subjectsArray = Array.from(subjectsMap.values()).map(subj => {
          const topicsArray = Array.from(subj.topicsMap.values());
          return {
            _id: subj._id,
            name: subj.name,
            topics: topicsArray,
            totalTests: topicsArray.reduce((acc, top) => acc + top.tests.length, 0)
          };
        });

        // Also build flat topicsArray for backwards compatibility
        const topicMap = new Map();
        catTests.forEach(t => {
          const tName = t.topicName || (t.topicId?.name) || 'General Practice';
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
            free: isFreeTest,
            isFreeTest,
            categoryId: cat._id,
            accessType: t.accessType,
            price: t.price || 49,
            status: t.status,
          });
        });

        const flatTopicsArray = Array.from(topicMap.entries()).map(([tName, tList]) => ({
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
          subjects: subjectsArray,
          topics: flatTopicsArray
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
        if (['deactivated', 'disabled', 'draft'].includes(mockTest.status) && !req.user?.role?.includes('admin')) {
          return res.status(400).json({ success: false, message: 'This mock test is currently disabled' });
        }
        if ((mockTest.status === 'scheduled' || mockTest.status === 'coming_soon') && mockTest.publishAt && new Date(mockTest.publishAt) > new Date() && !req.user?.role?.includes('admin')) {
          return res.status(400).json({
            success: false,
            isComingSoon: true,
            publishAt: mockTest.publishAt,
            message: `This test is Coming Soon and will be available on ${new Date(mockTest.publishAt).toLocaleString()}`
          });
        }

        const isFull = mockTest.testType === 'full_length' || (mockTest.totalMarks && mockTest.totalMarks >= 100);
        test = {
          _id: mockTest._id,
          title: mockTest.name || mockTest.title,
          description: mockTest.description,
          subjectId: { name: mockTest.subject?.name || mockTest.examination?.name || 'Mock Test' },
          topicId: { name: mockTest.subTopic || mockTest.topicName || (isFull ? 'Full Length Test' : 'Sectional Test') },
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

    // 1. Direct testId match
    let instruction = await SubjectTestInstruction.findOne({ testId: test._id, status: 'active' });

    // 2. Sub-Topic / Topic / Subject level match
    if (!instruction && test.subjectId) {
      const sId = test.subjectId._id || test.subjectId;
      const sName = test.subjectId?.name || test.subjectName || '';
      const tName = test.topicId?.name || test.topicName || '';
      const subName = test.subTopic || '';

      if (subName && tName) {
        instruction = await SubjectTestInstruction.findOne({
          status: 'active',
          $or: [
            { subjectId: sId, topicName: new RegExp(`^${tName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), subTopic: new RegExp(`^${subName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            { subjectName: new RegExp(`^${sName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), topicName: new RegExp(`^${tName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), subTopic: new RegExp(`^${subName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          ]
        });
      }

      if (!instruction && tName) {
        instruction = await SubjectTestInstruction.findOne({
          status: 'active',
          $or: [
            { subjectId: sId, topicName: new RegExp(`^${tName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            { subjectName: new RegExp(`^${sName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), topicName: new RegExp(`^${tName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          ]
        });
      }

      if (!instruction) {
        instruction = await SubjectTestInstruction.findOne({
          status: 'active',
          $or: [
            { subjectId: sId, topicName: { $in: ['', 'All Topics', 'all', null] } },
            { subjectName: new RegExp(`^${sName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), topicName: { $in: ['', 'All Topics', 'all', null] } }
          ]
        });
      }
    }

    // 3. Global All-Subjects Instruction match
    if (!instruction) {
      instruction = await SubjectTestInstruction.findOne({
        status: 'active',
        $or: [
          { subjectName: { $in: ['All', 'All Subjects', 'all', 'General', ''] } },
          { subjectId: null }
        ]
      });
    }

    // 4. Default Fallback
    if (!instruction) {
      instruction = {
        title: test.title || 'General Examination Instructions',
        summary: test.description || 'Competitive Exam Online Test',
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
        if (['deactivated', 'disabled', 'draft'].includes(mockTest.status) && !req.user?.role?.includes('admin')) {
          return res.status(400).json({ success: false, message: 'This mock test is currently disabled' });
        }
        if ((mockTest.status === 'scheduled' || mockTest.status === 'coming_soon') && mockTest.publishAt && new Date(mockTest.publishAt) > new Date() && !req.user?.role?.includes('admin')) {
          return res.status(400).json({
            success: false,
            message: `This test is Coming Soon and will be available on ${new Date(mockTest.publishAt).toLocaleString()}`
          });
        }

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

    // Admin role bypass — admins/superadmin can attempt any test without payment or repeat restrictions
    const ADMIN_ROLES = ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'];
    const isAdminUser = ADMIN_ROLES.includes(req.user?.role);

    // 0. Single-Attempt Enforcement for Regular Students (free or purchased tests can only be attempted 1 time)
    if (!isAdminUser && !isPreview) {
      const completedAttempt = await SubjectTestAttempt.findOne({
        userId,
        testId: test._id,
        status: 'completed'
      }).sort('-createdAt').lean();

      if (completedAttempt) {
        return res.status(403).json({
          success: false,
          alreadyAttempted: true,
          attemptId: completedAttempt._id,
          message: 'You have already attempted this exam. Each exam can only be attempted once.'
        });
      }
    }

    // 1. Premium Access Check (if not preview and not admin)
    if (test.accessType === 'Premium' && !isPreview && !isAdminUser) {
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

    // 2. Category-Based Access Gate (if not preview and not MockTest and not admin)
    if (!isPreview && !isMockTest && !isAdminUser) {
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
        explanationImage: q.explanationImage || '',
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

/* ── Get Logged-in Student Completed Attempted Test IDs ──────────────────── */
exports.getUserAttemptedTestIds = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const completedAttempts = await SubjectTestAttempt.find({
      userId,
      status: 'completed'
    }).select('testId _id score percentage accuracy timeTakenSec createdAt').sort('-createdAt').lean();

    const attemptedMap = {};
    const testIds = [];

    completedAttempts.forEach(a => {
      const tIdStr = String(a.testId || '');
      if (tIdStr && !attemptedMap[tIdStr]) {
        testIds.push(tIdStr);
        attemptedMap[tIdStr] = {
          attemptId: a._id,
          score: a.score,
          percentage: a.percentage,
          accuracy: a.accuracy,
          timeTakenSec: a.timeTakenSec,
          date: a.createdAt
        };
      }
    });

    res.json({
      success: true,
      data: testIds,
      attemptDetails: attemptedMap
    });
  } catch (err) { next(err); }
};

/* ── Get Student Live Rank & Leaderboard ──────────────────────────────────── */
exports.getMyRankAndLeaderboard = async (req, res, next) => {
  try {
    const currentUserId = String(req.user._id);
    const ADMIN_ROLES = ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'];

    // Fetch all completed attempts across the entire platform
    const rawAttempts = await SubjectTestAttempt.find({ status: 'completed' })
      .select('userId testId score percentage accuracy correctCount incorrectCount skippedCount timeTakenSec createdAt')
      .populate('userId', 'name email phone avatar role isBanned')
      .lean();

    // Exclude admin accounts from student ranking calculations
    const allAttempts = rawAttempts.filter(a => a.userId && !ADMIN_ROLES.includes(a.userId.role));

    // Map all tests for metadata
    const testIds = [...new Set(allAttempts.map(a => String(a.testId)).filter(Boolean))];
    const [bankTests, mockTests] = await Promise.all([
      SubjectTest.find({ _id: { $in: testIds } }).select('title subjectId totalMarks positiveMarks').lean(),
      require('../models/MockTest').find({ _id: { $in: testIds } }).select('name title totalMarks positiveMarks examination').lean()
    ]);

    const testInfoMap = new Map();
    bankTests.forEach(t => testInfoMap.set(String(t._id), { title: t.title, type: 'Subject Test' }));
    mockTests.forEach(m => testInfoMap.set(String(m._id), { title: m.name || m.title, type: 'Mock Test' }));

    // 1. Overall Student Aggregation
    const studentStatsMap = new Map();

    allAttempts.forEach(a => {
      if (!a.userId) return;
      const uId = String(a.userId._id || a.userId);
      const prev = studentStatsMap.get(uId) || {
        userId: uId,
        name: a.userId.name || 'Candidate',
        email: a.userId.email || '',
        avatar: a.userId.avatar || '',
        totalScore: 0,
        totalAttempts: 0,
        percentageSum: 0,
        accuracySum: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalTimeTakenSec: 0,
        lastAttemptDate: a.createdAt
      };

      prev.totalScore += Number(a.score || 0);
      prev.totalAttempts += 1;
      prev.percentageSum += Number(a.percentage || 0);
      prev.accuracySum += Number(a.accuracy || 0);
      prev.totalCorrect += Number(a.correctCount || 0);
      prev.totalIncorrect += Number(a.incorrectCount || 0);
      prev.totalTimeTakenSec += Number(a.timeTakenSec || 0);
      if (new Date(a.createdAt) > new Date(prev.lastAttemptDate)) {
        prev.lastAttemptDate = a.createdAt;
      }

      studentStatsMap.set(uId, prev);
    });

    // Format & calculate averages
    const allRankedStudents = Array.from(studentStatsMap.values()).map(s => ({
      userId: s.userId,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      totalScore: Number(s.totalScore.toFixed(2)),
      totalAttempts: s.totalAttempts,
      avgPercentage: s.totalAttempts > 0 ? Number((s.percentageSum / s.totalAttempts).toFixed(1)) : 0,
      avgAccuracy: s.totalAttempts > 0 ? Number((s.accuracySum / s.totalAttempts).toFixed(1)) : 0,
      totalCorrect: s.totalCorrect,
      totalIncorrect: s.totalIncorrect,
      totalTimeTakenSec: s.totalTimeTakenSec,
      lastAttemptDate: s.lastAttemptDate,
      isCurrentUser: s.userId === currentUserId
    }));

    // Sort by: totalScore DESC, avgAccuracy DESC, totalCorrect DESC, totalTimeTakenSec ASC
    allRankedStudents.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.avgAccuracy !== a.avgAccuracy) return b.avgAccuracy - a.avgAccuracy;
      if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
      return a.totalTimeTakenSec - b.totalTimeTakenSec;
    });

    // Assign ranks and badges
    allRankedStudents.forEach((st, idx) => {
      st.rank = idx + 1;
      if (st.rank === 1) st.badge = '🥇 Gold Champion';
      else if (st.rank === 2) st.badge = '🥈 Silver Star';
      else if (st.rank === 3) st.badge = '🥉 Bronze Elite';
      else if (st.rank <= 10) st.badge = '🌟 Top 10 Performer';
      else if (st.rank <= 15) st.badge = '⚡ Top 15 Aspirant';
      else if (st.rank <= 50) st.badge = '🎯 Aspirant Master';
      else st.badge = '📝 Candidate';
    });

    // Find current student's overall rank
    const myRankEntry = allRankedStudents.find(s => s.userId === currentUserId);
    const totalStudentsRanked = allRankedStudents.length;
    const myRank = myRankEntry ? myRankEntry.rank : null;
    const myPercentile = (myRank && totalStudentsRanked > 0)
      ? Math.max(1, Number((((totalStudentsRanked - myRank + 1) / totalStudentsRanked) * 100).toFixed(1)))
      : 0;
    const myTopPercentage = (myRank && totalStudentsRanked > 0)
      ? Number(((myRank / totalStudentsRanked) * 100).toFixed(1))
      : 0;

    // 2. Exam-wise Rank for Current Student
    const myAttempts = allAttempts.filter(a => a.userId && String(a.userId._id || a.userId) === currentUserId);
    const myExamRanks = myAttempts.map(myA => {
      const tIdStr = String(myA.testId);
      const testAttempts = allAttempts.filter(a => String(a.testId) === tIdStr);

      // Sort attempts for this specific test
      testAttempts.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return (a.timeTakenSec || 0) - (b.timeTakenSec || 0);
      });

      const examRank = testAttempts.findIndex(a => String(a._id) === String(myA._id)) + 1;
      const tMeta = testInfoMap.get(tIdStr) || { title: 'Practice Exam', type: 'Test' };

      return {
        attemptId: myA._id,
        testId: tIdStr,
        testTitle: tMeta.title,
        testType: tMeta.type,
        score: myA.score || 0,
        accuracy: myA.accuracy || 0,
        percentage: myA.percentage || 0,
        rank: examRank || 1,
        totalCandidates: testAttempts.length,
        date: myA.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        myRank: myRank || '—',
        totalStudentsRanked,
        percentile: myPercentile,
        topPercentage: myTopPercentage,
        isInTop15: myRank ? myRank <= 15 : false,
        myStats: myRankEntry || {
          rank: '—',
          totalScore: 0,
          totalAttempts: 0,
          avgPercentage: 0,
          avgAccuracy: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          badge: 'Candidate'
        },
        myExamRanks,
        topLeaderboard: allRankedStudents.slice(0, 15)
      }
    });
  } catch (err) { next(err); }
};

/* ── Admin: Comprehensive Rankings & Performance Dashboard ───────────────── */
exports.getAdminRankings = async (req, res, next) => {
  try {
    const { testId, search = '', sortBy = 'score' } = req.query;
    const ADMIN_ROLES = ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'];

    // Get all completed attempts
    const filter = { status: 'completed' };
    if (testId && testId !== 'all') {
      filter.testId = testId;
    }

    const rawAttempts = await SubjectTestAttempt.find(filter)
      .populate('userId', 'name email phone avatar role isBanned createdAt')
      .populate('testId', 'title name subjectId')
      .sort('-score -accuracy')
      .lean();

    // Exclude admin/staff accounts from student rankings
    const attempts = rawAttempts.filter(a => a.userId && !ADMIN_ROLES.includes(a.userId.role));

    // Get all tests list for dropdown filter
    const [subjTests, mockTests] = await Promise.all([
      SubjectTest.find({ status: 'published' }).select('title _id').lean(),
      require('../models/MockTest').find({ status: 'published' }).select('name title _id').lean()
    ]);

    const allTestsList = [
      ...subjTests.map(t => ({ _id: t._id, title: t.title, type: 'Subject Test' })),
      ...mockTests.map(m => ({ _id: m._id, title: m.name || m.title, type: 'Mock Test' }))
    ];

    // If specific test selected: Rank candidate attempts for that test
    if (testId && testId !== 'all') {
      let filtered = attempts.filter(a => a.userId);
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(a =>
          a.userId?.name?.toLowerCase().includes(q) ||
          a.userId?.email?.toLowerCase().includes(q) ||
          a.userId?.phone?.includes(q)
        );
      }

      filtered.sort((a, b) => {
        if (sortBy === 'time') return (a.timeTakenSec || 0) - (b.timeTakenSec || 0);
        if (sortBy === 'accuracy') return (b.accuracy || 0) - (a.accuracy || 0);
        if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
        return (b.score || 0) - (a.score || 0);
      });

      const ranked = filtered.map((a, idx) => ({
        rank: idx + 1,
        attemptId: a._id,
        user: {
          _id: a.userId._id,
          name: a.userId.name || 'Candidate',
          email: a.userId.email || '',
          phone: a.userId.phone || '',
          avatar: a.userId.avatar || ''
        },
        testTitle: a.testId?.title || a.testId?.name || 'Exam',
        score: a.score || 0,
        percentage: a.percentage || 0,
        accuracy: a.accuracy || 0,
        correctCount: a.correctCount || 0,
        incorrectCount: a.incorrectCount || 0,
        skippedCount: a.skippedCount || 0,
        timeTakenSec: a.timeTakenSec || 0,
        date: a.createdAt
      }));

      const avgScore = ranked.length > 0 ? (ranked.reduce((acc, r) => acc + r.score, 0) / ranked.length).toFixed(1) : 0;
      const topScore = ranked.length > 0 ? ranked[0].score : 0;

      return res.json({
        success: true,
        data: {
          mode: 'test_specific',
          stats: {
            totalCandidates: ranked.length,
            averageScore: Number(avgScore),
            highestScore: topScore,
            topCandidate: ranked[0] || null
          },
          testsList: allTestsList,
          rankings: ranked
        }
      });
    }

    // Overall Platform-Wide Aggregation
    const studentMap = new Map();

    attempts.forEach(a => {
      if (!a.userId) return;
      const uId = String(a.userId._id);
      const prev = studentMap.get(uId) || {
        user: {
          _id: uId,
          name: a.userId.name || 'Candidate',
          email: a.userId.email || '',
          phone: a.userId.phone || '',
          avatar: a.userId.avatar || '',
          joinedAt: a.userId.createdAt
        },
        totalScore: 0,
        totalAttempts: 0,
        percentageSum: 0,
        accuracySum: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalSkipped: 0,
        totalTimeTakenSec: 0,
        lastActive: a.createdAt,
        exams: []
      };

      prev.totalScore += Number(a.score || 0);
      prev.totalAttempts += 1;
      prev.percentageSum += Number(a.percentage || 0);
      prev.accuracySum += Number(a.accuracy || 0);
      prev.totalCorrect += Number(a.correctCount || 0);
      prev.totalIncorrect += Number(a.incorrectCount || 0);
      prev.totalSkipped += Number(a.skippedCount || 0);
      prev.totalTimeTakenSec += Number(a.timeTakenSec || 0);
      if (new Date(a.createdAt) > new Date(prev.lastActive)) {
        prev.lastActive = a.createdAt;
      }
      prev.exams.push({
        title: a.testId?.title || a.testId?.name || 'Test',
        score: a.score || 0,
        date: a.createdAt
      });

      studentMap.set(uId, prev);
    });

    let overallList = Array.from(studentMap.values()).map(s => ({
      user: s.user,
      totalScore: Number(s.totalScore.toFixed(2)),
      totalAttempts: s.totalAttempts,
      avgPercentage: s.totalAttempts > 0 ? Number((s.percentageSum / s.totalAttempts).toFixed(1)) : 0,
      avgAccuracy: s.totalAttempts > 0 ? Number((s.accuracySum / s.totalAttempts).toFixed(1)) : 0,
      totalCorrect: s.totalCorrect,
      totalIncorrect: s.totalIncorrect,
      totalSkipped: s.totalSkipped,
      totalTimeTakenSec: s.totalTimeTakenSec,
      lastActive: s.lastActive,
      recentExams: s.exams.slice(-3)
    }));

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      overallList = overallList.filter(s =>
        s.user.name?.toLowerCase().includes(q) ||
        s.user.email?.toLowerCase().includes(q) ||
        s.user.phone?.includes(q)
      );
    }

    // Sort
    overallList.sort((a, b) => {
      if (sortBy === 'accuracy') return b.avgAccuracy - a.avgAccuracy;
      if (sortBy === 'attempts') return b.totalAttempts - a.totalAttempts;
      if (sortBy === 'recent') return new Date(b.lastActive) - new Date(a.lastActive);
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.avgAccuracy - a.avgAccuracy;
    });

    overallList.forEach((st, idx) => {
      st.rank = idx + 1;
      if (st.rank === 1) st.badge = '🥇 Gold Champion';
      else if (st.rank === 2) st.badge = '🥈 Silver Star';
      else if (st.rank === 3) st.badge = '🥉 Bronze Elite';
      else if (st.rank <= 10) st.badge = '🌟 Top 10';
      else st.badge = '🎯 Aspirant';
    });

    const totalStudents = overallList.length;
    const avgPlatformScore = totalStudents > 0 ? (overallList.reduce((acc, s) => acc + s.totalScore, 0) / totalStudents).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        mode: 'overall',
        stats: {
          totalRankedStudents: totalStudents,
          totalCompletedAttempts: attempts.length,
          averagePlatformScore: Number(avgPlatformScore),
          topPerformer: overallList[0] || null
        },
        testsList: allTestsList,
        rankings: overallList
      }
    });
  } catch (err) { next(err); }
};
