const SubjectTestSubject = require('../models/SubjectTestSubject');
const SubjectTestTopic   = require('../models/SubjectTestTopic');
const SubjectTestQuestion= require('../models/SubjectTestQuestion');
const SubjectTest        = require('../models/SubjectTest');
const SubjectTestQuestionMap = require('../models/SubjectTestQuestionMap');
const SubjectTestInstruction = require('../models/SubjectTestInstruction');
const SubjectTestConfig      = require('../models/SubjectTestConfig');
const SubjectTestCategoryPurchase = require('../models/SubjectTestCategoryPurchase');
const Question = require('../models/Question');
const MockTest = require('../models/MockTest');
const { emitEvent } = require('../utils/socket');

const syncQuestionDeletionWithTests = async (questionIds) => {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return;
  try {
    const maps = await SubjectTestQuestionMap.find({
      $or: [{ questionId: { $in: questionIds } }, { _id: { $in: questionIds } }]
    });
    const affectedSubjectTestIds = [...new Set(maps.map(m => m.testId.toString()))];

    await SubjectTestQuestionMap.deleteMany({
      $or: [{ questionId: { $in: questionIds } }, { _id: { $in: questionIds } }]
    });

    for (const testId of affectedSubjectTestIds) {
      const remainingCount = await SubjectTestQuestionMap.countDocuments({ testId });
      const test = await SubjectTest.findById(testId);
      if (test) {
        if (remainingCount === 0) {
          test.status = 'archived';
          test.totalQuestions = 0;
          test.totalMarks = 0;
          await test.save();
        } else {
          test.totalQuestions = remainingCount;
          test.totalMarks = remainingCount * (test.positiveMarks || 1);
          await test.save();
        }
      }
    }

    const affectedMockTests = await MockTest.find({
      $or: [
        { 'questions.question': { $in: questionIds } },
        { 'questions._id': { $in: questionIds } }
      ]
    });

    for (const mt of affectedMockTests) {
      mt.questions = mt.questions.filter(q => {
        const qId = (q.question?._id || q.question || q._id).toString();
        return !questionIds.some(id => id.toString() === qId);
      });
      mt.completedQuestions = mt.questions.length;
      mt.totalQuestions = mt.questions.length;
      mt.totalMarks = mt.questions.length * (mt.positiveMarks || 1);
      if (mt.questions.length === 0) {
        mt.status = 'archived';
      }
      await mt.save();
    }
  } catch (err) {
    console.error('Error syncing question deletion with tests:', err);
  }
};

/* ── Banner & Page Config ────────────────────────────────────────────────── */
exports.getConfig = async (req, res, next) => {
  try {
    let cfg = await SubjectTestConfig.findOne();
    if (!cfg) {
      cfg = await SubjectTestConfig.create({});
    }
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};

exports.updateConfig = async (req, res, next) => {
  try {
    let cfg = await SubjectTestConfig.findOne();
    if (!cfg) {
      cfg = await SubjectTestConfig.create(req.body);
    } else {
      Object.assign(cfg, req.body);
      await cfg.save();
    }
    res.json({ success: true, message: 'Subject test settings updated', data: cfg });
  } catch (err) { next(err); }
};

/* ── Dashboard Stats ───────────────────────────────────────────────────────── */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalSubjects,
      totalTopics,
      totalTests,
      publishedTests,
      draftTests,
      freeTests,
      premiumTests,
      totalQuestions,
    ] = await Promise.all([
      SubjectTestSubject.countDocuments(),
      SubjectTestTopic.countDocuments(),
      SubjectTest.countDocuments(),
      SubjectTest.countDocuments({ status: 'published' }),
      SubjectTest.countDocuments({ status: 'draft' }),
      SubjectTest.countDocuments({ accessType: 'Free' }),
      SubjectTest.countDocuments({ accessType: 'Premium' }),
      SubjectTestQuestion.countDocuments({ status: { $ne: 'archived' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalSubjects,
        totalTopics,
        totalTests,
        publishedTests,
        draftTests,
        freeTests,
        premiumTests,
        totalQuestions,
      }
    });
  } catch (err) { next(err); }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const list = await SubjectTestSubject.find().sort('displayOrder createdAt');
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
};

exports.getCategoriesDropdown = async (req, res, next) => {
  try {
    const list = await SubjectTestSubject.find({ isActive: { $ne: false }, status: { $ne: 'inactive' } }).sort('displayOrder createdAt');
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
};

exports.createSubject = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user?._id };
    const doc = await SubjectTestSubject.create(data);
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const doc = await SubjectTestSubject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.reorderSubjects = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (Array.isArray(orderedIds)) {
      const ops = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { displayOrder: index },
        },
      }));
      await SubjectTestSubject.bulkWrite(ops);
    }
    res.json({ success: true, message: 'Subject Test categories reordered successfully' });
  } catch (err) { next(err); }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const Subject = require('../models/Subject');
    const targetId = req.params.id;

    const stSub = await SubjectTestSubject.findById(targetId);
    let subName = stSub?.name;
    if (stSub) {
      await stSub.deleteOne();
    }

    let mainSub = await Subject.findById(targetId);
    if (!mainSub && subName) {
      mainSub = await Subject.findOne({ name: { $regex: new RegExp(`^${subName.trim()}$`, 'i') } });
    }
    if (mainSub) {
      await mainSub.deleteOne();
    }

    res.json({ success: true, message: 'Subject Test Category deleted from all tabs' });
  } catch (err) { next(err); }
};

/* ── Topic CRUD ─────────────────────────────────────────────────────────────── */
exports.getTopics = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    const list = await SubjectTestTopic.find(filter).populate('subjectId', 'name color').sort('displayOrder createdAt');
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
};

exports.createTopic = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user?._id };
    const doc = await SubjectTestTopic.create(data);
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const doc = await SubjectTestTopic.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.deleteTopic = async (req, res, next) => {
  try {
    const doc = await SubjectTestTopic.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json({ success: true, message: 'Topic deactivated', data: doc });
  } catch (err) { next(err); }
};

/* ── Tests CRUD ─────────────────────────────────────────────────────────────── */
const mongoose = require('mongoose');
const Subject = require('../models/Subject');

const ensureTestQuestions = async (test) => {
  if (!test || !test._id) return 0;
  try {
    let mappedCount = await SubjectTestQuestionMap.countDocuments({ testId: test._id });

    if (mappedCount === 0) {
      const Question = require('../models/Question');
      const sId = test.subjectId?._id || test.subjectId;
      const topic = test.topicName || test.topicId?.name;
      const subTopic = test.subTopic;

      if (sId && mongoose.Types.ObjectId.isValid(sId)) {
        const qFilter = { subject: sId, status: { $ne: 'archived' } };
        if (topic) qFilter.topic = new RegExp(`^${topic.trim().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i');
        if (subTopic && subTopic.trim()) qFilter.subTopic = new RegExp(`^${subTopic.trim().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i');

        const bankQs = await Question.find(qFilter).limit(50);
        if (bankQs.length > 0) {
          for (let i = 0; i < bankQs.length; i++) {
            await SubjectTestQuestionMap.create({
              testId: test._id,
              questionId: bankQs[i]._id,
              order: i + 1
            });
          }
          mappedCount = bankQs.length;
        }
      }
    }

    if (test.totalQuestions !== mappedCount) {
      test.totalQuestions = mappedCount;
      test.totalMarks = mappedCount * (test.positiveMarks || 1);
      await SubjectTest.findByIdAndUpdate(test._id, {
        totalQuestions: mappedCount,
        totalMarks: mappedCount * (test.positiveMarks || 1)
      });
    }

    return mappedCount;
  } catch (err) {
    return test.totalQuestions || 0;
  }
};

exports.getTests = async (req, res, next) => {
  try {
    const { subjectId, topicId, status, accessType } = req.query;
    const filter = { status: { $ne: 'archived' } };

    if (subjectId) {
      if (mongoose.Types.ObjectId.isValid(subjectId)) {
        filter.subjectId = subjectId;
      } else {
        const foundSub = await Subject.findOne({ name: new RegExp(`^${subjectId}$`, 'i') });
        if (foundSub) filter.subjectId = foundSub._id;
        else filter.subjectId = null; // No matching subject
      }
    }
    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) {
      filter.topicId = topicId;
    }
    if (status) filter.status = status;
    if (accessType) filter.accessType = accessType;

    const list = await SubjectTest.find(filter)
      .populate('categoryId', 'name color icon')
      .populate('subjectId', 'name color icon status topics')
      .populate('topicId', 'name')
      .sort('-createdAt');

    await Promise.all(list.map(t => ensureTestQuestions(t)));

    res.json({ success: true, data: list });
  } catch (err) { next(err); }
};

exports.getTest = async (req, res, next) => {
  try {
    const doc = await SubjectTest.findById(req.params.id)
      .populate('categoryId', 'name color icon')
      .populate('subjectId', 'name color icon status topics')
      .populate('topicId', 'name');
    if (!doc) return res.status(404).json({ success: false, message: 'Test not found' });
    
    // Also fetch instruction config
    const instruction = await SubjectTestInstruction.findOne({ testId: doc._id });

    // Also fetch mapped questions
    const maps = await SubjectTestQuestionMap.find({ testId: doc._id })
      .populate('questionId')
      .sort('order');

    res.json({
      success: true,
      data: {
        ...doc.toObject(),
        instruction,
        mappedQuestions: maps.map(m => ({
          ...m.questionId?.toObject(),
          mapId: m._id,
          order: m.order,
          marksOverride: m.marksOverride,
          negativeMarksOverride: m.negativeMarksOverride,
        }))
      }
    });
  } catch (err) { next(err); }
};

exports.createTest = async (req, res, next) => {
  try {
    let { subjectId, topicId, topicName, title } = req.body;

    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }

    const selectedTopic = topicName || (typeof topicId === 'string' ? topicId : null);
    if (!selectedTopic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    // 1. Resolve subject from main Subject collection safely
    let subjectDoc = null;
    if (mongoose.Types.ObjectId.isValid(subjectId)) {
      subjectDoc = await Subject.findById(subjectId);
      if (!subjectDoc) {
        const legacySub = await SubjectTestSubject.findById(subjectId);
        if (legacySub) {
          subjectDoc = await Subject.findOne({ name: legacySub.name });
        }
      }
    } else {
      subjectDoc = await Subject.findOne({ name: new RegExp(`^${subjectId}$`, 'i') });
    }

    if (!subjectDoc) {
      // Auto-create subject in main Subject collection if it does not exist yet
      subjectDoc = await Subject.create({
        name: subjectId,
        status: 'active',
        topics: [selectedTopic]
      });
    }

    // 2. Auto-register topic under subject if not already present
    if (subjectDoc && selectedTopic) {
      const topicExists = (subjectDoc.topics || []).some(
        t => (typeof t === 'string' ? t : t?.name || '').toLowerCase() === selectedTopic.toLowerCase()
      );
      if (!topicExists) {
        subjectDoc.topics.push(selectedTopic);
        await subjectDoc.save();
      }
    }

    // Auto-resolve matching SubjectTestSubject categoryId
    const allCategories = await SubjectTestSubject.find({ isActive: true });
    const isSubjectCategoryMatch = (sName, cName) => {
      if (!sName || !cName) return false;
      const s = String(sName).trim().toLowerCase();
      const c = String(cName).trim().toLowerCase();
      return s === c || (s.includes('math') && c.includes('math')) || (s.includes('comp') && c.includes('comp')) || (s.includes('gk') && c.includes('gk')) || (s.includes('eng') && c.includes('eng')) || (s.includes('odia') && c.includes('odia')) || (s.includes('reason') && c.includes('reason'));
    };
    const matchingCat = allCategories.find(c => isSubjectCategoryMatch(subjectDoc.name, c.name));

    const data = {
      ...req.body,
      status: req.body.status || 'published',
      subjectId: subjectDoc._id,
      categoryId: matchingCat ? matchingCat._id : (req.body.categoryId || undefined),
      topicName: selectedTopic,
      createdBy: req.user?._id
    };
    if (data.topicId && !mongoose.Types.ObjectId.isValid(data.topicId)) {
      delete data.topicId;
    }

    const doc = await SubjectTest.create(data);

    // Auto-import matching questions from Question Bank by Subject, Topic AND Sub-Topic
    try {
      const Question = require('../models/Question');
      let matchingQs = [];

      const queryFilter = {
        status: { $ne: 'archived' }
      };
      if (subjectDoc && subjectDoc._id) {
        queryFilter.subject = subjectDoc._id;
      }
      if (selectedTopic) {
        queryFilter.topic = new RegExp(`^${selectedTopic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      }
      if (data.subTopic && data.subTopic.trim()) {
        queryFilter.subTopic = new RegExp(`^${data.subTopic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      }

      // Find questions strictly matching this Subject, Topic, and Sub-Topic
      matchingQs = await Question.find(queryFilter).limit(50);

      // Only if no subtopic was specified and exact topic didn't match, try section/topic regex
      if (matchingQs.length === 0 && !data.subTopic && subjectDoc?._id && selectedTopic) {
        matchingQs = await Question.find({
          subject: subjectDoc._id,
          status: { $ne: 'archived' },
          $or: [
            { topic: new RegExp(selectedTopic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { section: new RegExp(selectedTopic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          ]
        }).limit(50);
      }

      if (matchingQs.length > 0) {
        const maps = matchingQs.map((q, idx) => ({
          testId: doc._id,
          questionId: q._id,
          questionModel: 'Question',
          order: idx + 1
        }));
        await SubjectTestQuestionMap.insertMany(maps);

        doc.totalQuestions = matchingQs.length;
        doc.totalMarks = matchingQs.length * (doc.positiveMarks || 1);
        await doc.save();
      } else {
        doc.totalQuestions = 0;
        doc.totalMarks = 0;
        await doc.save();
      }
    } catch (importErr) {
      console.error('Error auto-importing questions from bank:', importErr);
    }

    // Create default instruction record
    await SubjectTestInstruction.create({
      testId: doc._id,
      title: doc.title,
      summary: doc.description || `${doc.title} Practice Test`,
      sections: [{ name: subjectDoc.name, questions: doc.totalQuestions || 0, marks: doc.totalMarks || 0, duration: doc.duration || 25, negativeMarking: doc.negativeMarks || 0.25 }],
      instructions: [
        `You have ${doc.duration || 25} minutes to complete the test.`,
        `The test contains ${doc.totalQuestions || 0} questions.`,
        'There is only one correct answer to each question.',
        `Positive marks: +${doc.positiveMarks || 1}, Negative marking: -${doc.negativeMarks || 0.25}.`,
        'You can mark questions for review using the question palette.',
        'When the timer reaches 00:00, the test will automatically submit.'
      ]
    });

    emitEvent('subject_tests_updated', { action: 'create', data: doc });

    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.updateTest = async (req, res, next) => {
  try {
    let { subjectId, topicId, topicName } = req.body;
    let updateData = { ...req.body };

    if (updateData.topicId && !mongoose.Types.ObjectId.isValid(updateData.topicId)) {
      delete updateData.topicId;
    }

    if (subjectId) {
      let subjectDoc = null;
      if (mongoose.Types.ObjectId.isValid(subjectId)) {
        subjectDoc = await Subject.findById(subjectId);
        if (!subjectDoc) {
          const legacySub = await SubjectTestSubject.findById(subjectId);
          if (legacySub) {
            subjectDoc = await Subject.findOne({ name: legacySub.name });
          }
        }
      } else {
        subjectDoc = await Subject.findOne({ name: new RegExp(`^${subjectId}$`, 'i') });
      }

      if (subjectDoc) {
        updateData.subjectId = subjectDoc._id;

        const allCategories = await SubjectTestSubject.find({ isActive: true });
        const isSubjectCategoryMatch = (sName, cName) => {
          if (!sName || !cName) return false;
          const s = String(sName).trim().toLowerCase();
          const c = String(cName).trim().toLowerCase();
          return s === c || (s.includes('math') && c.includes('math')) || (s.includes('comp') && c.includes('comp')) || (s.includes('gk') && c.includes('gk')) || (s.includes('eng') && c.includes('eng')) || (s.includes('odia') && c.includes('odia')) || (s.includes('reason') && c.includes('reason'));
        };
        const matchingCat = allCategories.find(c => isSubjectCategoryMatch(subjectDoc.name, c.name));
        if (matchingCat) {
          updateData.categoryId = matchingCat._id;
        }

        const selectedTopic = topicName || (typeof topicId === 'string' ? topicId : null);
        if (selectedTopic) {
          updateData.topicName = selectedTopic;
          const topicExists = (subjectDoc.topics || []).some(
            t => (typeof t === 'string' ? t : t?.name || '').toLowerCase() === selectedTopic.toLowerCase()
          );
          if (!topicExists) {
            subjectDoc.topics.push(selectedTopic);
            await subjectDoc.save();
          }
        }
      }
    }

    const doc = await SubjectTest.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Test not found' });
    
    emitEvent('subject_tests_updated', { action: 'update', data: doc });

    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.publishTest = async (req, res, next) => {
  try {
    const test = await SubjectTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    // Publish validation rules
    const mapCount = await SubjectTestQuestionMap.countDocuments({ testId: test._id });
    if (mapCount === 0) {
      return res.status(400).json({ success: false, message: 'Cannot publish test with 0 mapped questions. Please add questions first.' });
    }

    test.status = req.body.status || 'published';
    test.totalQuestions = mapCount;
    test.totalMarks = mapCount * (test.positiveMarks || 1);
    await test.save();

    emitEvent('subject_tests_updated', { action: 'publish', data: test });

    res.json({ success: true, message: `Test ${test.status} successfully`, data: test });
  } catch (err) { next(err); }
};

exports.deleteTest = async (req, res, next) => {
  try {
    const doc = await SubjectTest.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
    
    emitEvent('subject_tests_updated', { action: 'delete', id: req.params.id });

    res.json({ success: true, message: 'Test archived successfully', data: doc });
  } catch (err) { next(err); }
};

/* ── Instruction Management ─────────────────────────────────────────────────── */
exports.updateInstruction = async (req, res, next) => {
  try {
    const { testId } = req.params;
    let doc = await SubjectTestInstruction.findOne({ testId });
    if (!doc) {
      doc = await SubjectTestInstruction.create({ testId, ...req.body });
    } else {
      Object.assign(doc, req.body);
      await doc.save();
    }
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

/* ── Question Bank CRUD ─────────────────────────────────────────────────────── */
exports.getQuestions = async (req, res, next) => {
  try {
    const { subjectId, topicId, topic, subTopic, difficulty, search, status } = req.query;
    
    // Filter for SubjectTestQuestion model
    const filterSTQ = { status: status || { $ne: 'archived' } };
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) filterSTQ.subjectId = subjectId;
    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) filterSTQ.topicId = topicId;
    if (difficulty) filterSTQ.difficulty = difficulty;
    if (search) filterSTQ.questionText = { $regex: search, $options: 'i' };

    // Filter for Question model (Question Bank)
    const filterQ = { status: status || { $ne: 'archived' } };
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) filterQ.subject = subjectId;
    if (topic) filterQ.topic = new RegExp(`^${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (subTopic) filterQ.subTopic = new RegExp(`^${subTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (difficulty) filterQ.difficulty = difficulty.toLowerCase();
    if (search) filterQ.questionText = { $regex: search, $options: 'i' };

    const [stqList, qList] = await Promise.all([
      SubjectTestQuestion.find(filterSTQ).populate('subjectId', 'name').populate('topicId', 'name').sort('-createdAt'),
      Question.find(filterQ).populate('subject', 'name').sort('-createdAt')
    ]);

    const formattedSTQ = stqList.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'Moderate',
      subjectId: q.subjectId?._id || q.subjectId,
      subjectName: q.subjectId?.name || '',
      topicName: q.topicId?.name || q.topicName || '',
      subTopic: '',
      sourceModel: 'SubjectTestQuestion'
    }));

    const formattedQ = qList.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'Moderate',
      subjectId: q.subject?._id || q.subject,
      subjectName: q.subject?.name || '',
      topicName: q.topic || '',
      subTopic: q.subTopic || '',
      sourceModel: 'Question'
    }));

    const combined = [...formattedQ, ...formattedSTQ];
    const uniqueMap = new Map();
    combined.forEach(item => {
      if (!uniqueMap.has(String(item._id))) {
        uniqueMap.set(String(item._id), item);
      }
    });

    res.json({ success: true, data: Array.from(uniqueMap.values()) });
  } catch (err) { next(err); }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user?._id };
    const doc = await SubjectTestQuestion.create(data);
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const doc = await SubjectTestQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const doc = await SubjectTestQuestion.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
    if (doc) {
      await syncQuestionDeletionWithTests([doc._id]);
    }
    res.json({ success: true, message: 'Question archived', data: doc });
  } catch (err) { next(err); }
};

/* ── Bulk Question Import ───────────────────────────────────────────────────── */
exports.bulkImportQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions provided for import' });
    }

    const inserted = await SubjectTestQuestion.insertMany(
      questions.map(q => ({ ...q, createdBy: req.user?._id }))
    );
    res.status(201).json({ success: true, message: `Successfully imported ${inserted.length} questions`, count: inserted.length });
  } catch (err) { next(err); }
};

/* ── Test Question Mapping ──────────────────────────────────────────────────── */
exports.addQuestionsToTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { questionIds } = req.body; // Array of question IDs

    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'questionIds array is required' });
    }

    const existingCount = await SubjectTestQuestionMap.countDocuments({ testId });
    let added = 0;

    for (let i = 0; i < questionIds.length; i++) {
      const qId = questionIds[i];
      const exists = await SubjectTestQuestionMap.findOne({
        testId,
        $or: [{ questionId: qId }, { _id: qId }]
      });
      if (!exists) {
        let questionModel = 'SubjectTestQuestion';
        const isGlobalQ = await Question.exists({ _id: qId });
        if (isGlobalQ) {
          questionModel = 'Question';
        }

        await SubjectTestQuestionMap.create({
          testId,
          questionId: qId,
          questionModel,
          order: existingCount + added + 1
        });
        added++;
      }
    }

    // Update test question count & marks
    const totalCount = await SubjectTestQuestionMap.countDocuments({ testId });
    const test = await SubjectTest.findById(testId);
    if (test) {
      test.totalQuestions = totalCount;
      test.totalMarks = totalCount * (test.positiveMarks || 1);
      await test.save();
    }

    res.json({ success: true, message: `Added ${added} question(s) to test`, totalQuestions: totalCount });
  } catch (err) { next(err); }
};

exports.autoSelectQuestions = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { easyCount = 5, mediumCount = 5, hardCount = 2 } = req.body;

    const test = await SubjectTest.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    // Fetch questions matching topicId / subjectId
    const [easyQs, medQs, hardQs] = await Promise.all([
      SubjectTestQuestion.find({ topicId: test.topicId, difficulty: 'Easy', status: 'active' }).limit(easyCount),
      SubjectTestQuestion.find({ topicId: test.topicId, difficulty: 'Medium', status: 'active' }).limit(mediumCount),
      SubjectTestQuestion.find({ topicId: test.topicId, difficulty: 'Hard', status: 'active' }).limit(hardCount),
    ]);

    const selectedQs = [...easyQs, ...medQs, ...hardQs];
    let added = 0;

    for (let i = 0; i < selectedQs.length; i++) {
      const q = selectedQs[i];
      const exists = await SubjectTestQuestionMap.findOne({ testId, questionId: q._id });
      if (!exists) {
        await SubjectTestQuestionMap.create({ testId, questionId: q._id, order: i + 1 });
        added++;
      }
    }

    const totalCount = await SubjectTestQuestionMap.countDocuments({ testId });
    test.totalQuestions = totalCount;
    test.totalMarks = totalCount * (test.positiveMarks || 1);
    await test.save();

    emitEvent('subject_tests_updated', { action: 'questions_mapped', testId });

    res.json({ success: true, message: `Auto-selected ${added} questions`, totalQuestions: totalCount });
  } catch (err) { next(err); }
};

exports.removeQuestionFromTest = async (req, res, next) => {
  try {
    const { testId, questionId } = req.params;
    await SubjectTestQuestionMap.deleteOne({
      testId,
      $or: [{ questionId }, { _id: questionId }]
    });

    const totalCount = await SubjectTestQuestionMap.countDocuments({ testId });
    const test = await SubjectTest.findById(testId);
    if (test) {
      test.totalQuestions = totalCount;
      test.totalMarks = totalCount * (test.positiveMarks || 1);
      await test.save();
    }

    emitEvent('subject_tests_updated', { action: 'questions_mapped', testId });

    res.json({ success: true, message: 'Question removed from test', totalQuestions: totalCount });
  } catch (err) { next(err); }
};

exports.reorderTestQuestions = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { orderedQuestionIds } = req.body; // Array of question IDs in new order

    if (!Array.isArray(orderedQuestionIds)) {
      return res.status(400).json({ success: false, message: 'orderedQuestionIds array is required' });
    }

    for (let i = 0; i < orderedQuestionIds.length; i++) {
      await SubjectTestQuestionMap.updateOne(
        { testId, questionId: orderedQuestionIds[i] },
        { order: i + 1 }
      );
    }

    res.json({ success: true, message: 'Question order updated' });
  } catch (err) { next(err); }
};

/* ══════════════════════════════════════════════════════════════════
   CATEGORY PRICE MANAGEMENT
══════════════════════════════════════════════════════════════════ */

// GET /subjects/prices — admin: list all categories with their prices
exports.getAdminCategoryPrices = async (req, res, next) => {
  try {
    const categories = await SubjectTestSubject.find().sort('displayOrder createdAt').lean();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

// PATCH /subjects/:id/price — admin: set price for a category
exports.updateCategoryPrice = async (req, res, next) => {
  try {
    const { price } = req.body;
    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({ success: false, message: 'Valid price (number) is required' });
    }
    const doc = await SubjectTestSubject.findByIdAndUpdate(
      req.params.id,
      { price: Math.max(0, Number(price)) },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: doc, message: `Price updated to ₹${doc.price}` });
  } catch (err) { next(err); }
};

// GET /subjects/purchases/status — user: get purchased category IDs
exports.getCategoryPurchaseStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const purchases = await SubjectTestCategoryPurchase.find({ userId }).lean();
    const purchasedCategoryIds = purchases.map(p => String(p.categoryId));
    res.json({ success: true, data: purchasedCategoryIds });
  } catch (err) { next(err); }
};

// POST /subjects/:id/purchase — user: purchase a category
exports.purchaseCategory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id: categoryId } = req.params;
    const { paymentId = 'manual', orderId = '', amount } = req.body;

    const category = await SubjectTestSubject.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const paid = amount !== undefined ? Number(amount) : category.price;

    // Upsert purchase record (idempotent — safe to call multiple times)
    await SubjectTestCategoryPurchase.findOneAndUpdate(
      { userId, categoryId },
      { userId, categoryId, amount: paid, paymentId, orderId, purchasedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also record in main Purchase model for Admin Orders management
    const Purchase = require('../models/Purchase');
    const finalOrderId = orderId || ('ORD-SUBJ-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase());
    await Purchase.findOneAndUpdate(
      { student: userId, product: categoryId, productType: 'subject' },
      {
        orderId: finalOrderId,
        student: userId,
        productType: 'subject',
        product: categoryId,
        productModel: 'Subject',
        productName: `Subject Category: ${category.name}`,
        amount: paid,
        finalAmount: paid,
        status: 'completed',
        notes: `Subject Category purchase for ${category.name}`,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch(() => {});

    res.json({ success: true, message: `Access granted to all tests in "${category.name}"` });
  } catch (err) { next(err); }
};
