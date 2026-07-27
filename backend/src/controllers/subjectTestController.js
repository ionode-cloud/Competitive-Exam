const SubjectTestSubject = require('../models/SubjectTestSubject');
const SubjectTestTopic   = require('../models/SubjectTestTopic');
const SubjectTestQuestion= require('../models/SubjectTestQuestion');
const SubjectTest        = require('../models/SubjectTest');
const SubjectTestQuestionMap = require('../models/SubjectTestQuestionMap');
const SubjectTestInstruction = require('../models/SubjectTestInstruction');
const SubjectTestConfig      = require('../models/SubjectTestConfig');

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
    const list = await SubjectTestSubject.find({ isActive: true }).sort('displayOrder createdAt');
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
    const doc = await SubjectTestSubject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subject Test Category deleted', data: doc });
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

    const data = {
      ...req.body,
      status: req.body.status || 'published',
      subjectId: subjectDoc._id,
      topicName: selectedTopic,
      createdBy: req.user?._id
    };
    if (data.topicId && !mongoose.Types.ObjectId.isValid(data.topicId)) {
      delete data.topicId;
    }

    const doc = await SubjectTest.create(data);

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

    res.json({ success: true, message: `Test ${test.status} successfully`, data: test });
  } catch (err) { next(err); }
};

exports.deleteTest = async (req, res, next) => {
  try {
    const doc = await SubjectTest.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
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
    const { subjectId, topicId, difficulty, search, status } = req.query;
    const filter = { status: status || { $ne: 'archived' } };
    if (subjectId) filter.subjectId = subjectId;
    if (topicId) filter.topicId = topicId;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.questionText = { $regex: search, $options: 'i' };

    const list = await SubjectTestQuestion.find(filter)
      .populate('subjectId', 'name')
      .populate('topicId', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: list });
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
      const exists = await SubjectTestQuestionMap.findOne({ testId, questionId: qId });
      if (!exists) {
        await SubjectTestQuestionMap.create({
          testId,
          questionId: qId,
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

    res.json({ success: true, message: `Added ${added} questions to test`, totalQuestions: totalCount });
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

    res.json({ success: true, message: `Auto-selected ${added} questions`, totalQuestions: totalCount });
  } catch (err) { next(err); }
};

exports.removeQuestionFromTest = async (req, res, next) => {
  try {
    const { testId, questionId } = req.params;
    await SubjectTestQuestionMap.deleteOne({ testId, questionId });

    const totalCount = await SubjectTestQuestionMap.countDocuments({ testId });
    const test = await SubjectTest.findById(testId);
    if (test) {
      test.totalQuestions = totalCount;
      test.totalMarks = totalCount * (test.positiveMarks || 1);
      await test.save();
    }

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
