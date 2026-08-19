const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const Examination = require('../models/Examination');
const { paginate, paginateResponse } = require('../utils/pagination');
const { emitEvent } = require('../utils/socket');

// Helper: Ensure mock test questions are auto-imported from Question Bank if empty
const ensureMockTestQuestions = async (mt) => {
  if (!mt || !mt._id) return 0;
  try {
    if (Array.isArray(mt.questions) && mt.questions.length > 0) {
      return mt.questions.length;
    }

    const Question = require('../models/Question');
    let qFilter = { status: { $ne: 'archived' } };

    if (mt.subject) {
      qFilter.subject = mt.subject;
    }

    if (mt.subTopic && mt.subTopic.trim()) {
      const cleanSub = mt.subTopic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      qFilter.$or = [
        { subTopic: new RegExp(`^${cleanSub}$`, 'i') },
        { topic: new RegExp(`^${cleanSub}$`, 'i') }
      ];
    } else if (mt.topicName && mt.topicName.trim()) {
      const cleanTopic = mt.topicName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      qFilter.$or = [
        { topic: new RegExp(cleanTopic, 'i') },
        { section: new RegExp(cleanTopic, 'i') }
      ];
    }

    const matchingQs = await Question.find(qFilter).limit(50);
    if (matchingQs.length > 0) {
      mt.questions = matchingQs.map((q, idx) => ({
        question: q._id,
        order: idx + 1,
        marks: 1,
        negativeMarks: mt.negativeMarking || 0.25,
        section: mt.topicName || 'General'
      }));
      mt.totalQuestions = mt.questions.length;
      mt.completedQuestions = mt.questions.length;
      mt.totalMarks = mt.questions.length * 1;
      await mt.save();
      return mt.questions.length;
    }
  } catch (err) {
    console.error('Error in ensureMockTestQuestions:', err);
  }
  return 0;
};

// @desc    Get all mock tests
// @route   GET /api/mocktests
exports.getMockTests = async (req, res, next) => {
  try {
    const { search, status, examination, pricingType, page = 1, limit = 200, sort = '-createdAt' } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (examination) filter.examination = examination;
    if (pricingType) filter.pricingType = pricingType;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      MockTest.find(filter).sort(sort).skip(skip).limit(lim)
        .populate('examination', 'name')
        .populate('subject', 'name')
        .populate('createdBy', 'name'),
      MockTest.countDocuments(filter),
    ]);

    // Ensure question count and total marks accurately match real mapped questions
    const formattedData = await Promise.all(data.map(async (doc) => {
      if (!doc.questions || doc.questions.length === 0) {
        await ensureMockTestQuestions(doc);
      }
      const d = doc.toObject();
      const realCount = Array.isArray(d.questions) ? d.questions.length : (d.completedQuestions || 0);
      d.totalQuestions = realCount;
      d.completedQuestions = realCount;
      d.totalMarks = realCount * (d.positiveMarks || 1);
      return d;
    }));

    res.json({ success: true, ...paginateResponse(formattedData, total, page, lim) });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single mock test with questions
// @route   GET /api/mocktests/:id
exports.getMockTest = async (req, res, next) => {
  try {
    const mt = await MockTest.findById(req.params.id)
      .populate('examination', 'name')
      .populate({
        path: 'questions.question',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'chapter', select: 'name' },
        ],
      })
      .populate('createdBy', 'name');

    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });

    if (!mt.questions || mt.questions.length === 0) {
      await ensureMockTestQuestions(mt);
    }

    // Filter out deleted questions from Question Bank automatically
    if (Array.isArray(mt.questions)) {
      const validQuestions = mt.questions.filter(qItem => qItem.question !== null && qItem.question !== undefined);
      if (validQuestions.length !== mt.questions.length) {
        mt.questions = validQuestions;
        mt.completedQuestions = validQuestions.length;
        mt.totalQuestions = validQuestions.length;
        mt.totalMarks = validQuestions.length * 1;
        await mt.save();
      }
    }

    res.json({ success: true, data: mt });
  } catch (err) {
    next(err);
  }
};

// @desc    Create mock test
// @route   POST /api/mocktests
exports.createMockTest = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.subject || payload.subject === '') delete payload.subject;
    if (!payload.examination || payload.examination === '') delete payload.examination;
    if (!payload.name && payload.title) payload.name = payload.title;

    // Auto import matching questions from Question Bank by Subject, Topic, and Sub Topic
    let initialQuestions = [];
    if (payload.subject) {
      const qFilter = {
        subject: payload.subject,
        status: { $ne: 'archived' }
      };

      if (payload.subTopic && payload.subTopic.trim()) {
        const cleanSub = payload.subTopic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        qFilter.$or = [
          { subTopic: new RegExp(`^${cleanSub}$`, 'i') },
          { topic: new RegExp(`^${cleanSub}$`, 'i') }
        ];
      } else if (payload.topicName && payload.topicName.trim()) {
        const cleanTopic = payload.topicName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        qFilter.$or = [
          { topic: new RegExp(cleanTopic, 'i') },
          { section: new RegExp(cleanTopic, 'i') }
        ];
      }

      const matchingQs = await Question.find(qFilter).limit(50);
      initialQuestions = matchingQs.map((q, idx) => ({
        question: q._id,
        order: idx + 1,
        marks: 1,
        negativeMarks: payload.negativeMarking || 0.25,
        section: payload.topicName || 'General'
      }));
    }

    const mt = await MockTest.create({
      ...payload,
      questions: initialQuestions,
      totalQuestions: initialQuestions.length,
      completedQuestions: initialQuestions.length,
      totalMarks: initialQuestions.length * 1,
      createdBy: req.user?._id || undefined,
    });

    if (mt.examination) {
      await Examination.findByIdAndUpdate(mt.examination, { $inc: { mockTestsCount: 1 } }).catch(() => {});
    }
    emitEvent('mocktests_updated', { action: 'create', data: mt });

    res.status(201).json({ success: true, data: mt });
  } catch (err) {
    next(err);
  }
};

// @desc    Update mock test
// @route   PUT /api/mocktests/:id
exports.updateMockTest = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.subject || payload.subject === '') delete payload.subject;
    if (!payload.examination || payload.examination === '') delete payload.examination;
    if (!payload.name && payload.title) payload.name = payload.title;

    const mt = await MockTest.findByIdAndUpdate(req.params.id, payload, {
      new: true, runValidators: true,
    }).populate('examination', 'name');

    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });
    emitEvent('mocktests_updated', { action: 'update', data: mt });

    res.json({ success: true, data: mt });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete mock test
// @route   DELETE /api/mocktests/:id
exports.deleteMockTest = async (req, res, next) => {
  try {
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });

    await Examination.findByIdAndUpdate(mt.examination, { $inc: { mockTestsCount: -1 } });
    await mt.deleteOne();
    emitEvent('mocktests_updated', { action: 'delete', id: req.params.id });

    res.json({ success: true, message: 'Mock test deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Publish mock test
// @route   PATCH /api/mocktests/:id/publish
exports.publishMockTest = async (req, res, next) => {
  try {
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });

    if (mt.completedQuestions < mt.totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Cannot publish — only ${mt.completedQuestions}/${mt.totalQuestions} questions added`,
      });
    }

    mt.status = 'published';
    await mt.save();
    res.json({ success: true, data: mt, message: 'Mock test published' });
  } catch (err) {
    next(err);
  }
};

// @desc    Duplicate mock test
// @route   POST /api/mocktests/:id/duplicate
exports.duplicateMockTest = async (req, res, next) => {
  try {
    const original = await MockTest.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Mock test not found' });

    const copy = original.toObject();
    delete copy._id;
    copy.name = `${original.name} (Copy)`;
    copy.status = 'draft';
    copy.totalAttempts = 0;
    copy.isDuplicate = true;
    copy.originalMockTest = original._id;
    copy.createdBy = req.user._id;
    copy.publishAt = null;
    copy.examStartTime = null;
    copy.examEndTime = null;

    const newMt = await MockTest.create(copy);
    await Examination.findByIdAndUpdate(newMt.examination, { $inc: { mockTestsCount: 1 } });

    res.status(201).json({ success: true, data: newMt });
  } catch (err) {
    next(err);
  }
};

// @desc    Schedule mock test
// @route   PATCH /api/mocktests/:id/schedule
exports.scheduleMockTest = async (req, res, next) => {
  try {
    const { publishAt, examStartTime, examEndTime } = req.body;
    const mt = await MockTest.findByIdAndUpdate(
      req.params.id,
      { status: 'scheduled', publishAt, examStartTime, examEndTime },
      { new: true }
    );
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });
    res.json({ success: true, data: mt, message: 'Mock test scheduled' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add questions to mock test
// @route   POST /api/mocktests/:id/questions
exports.addQuestions = async (req, res, next) => {
  try {
    const { questionIds, section, marks, negativeMarks } = req.body;
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });

    const existing = mt.questions.map(q => q.question.toString());
    const toAdd = questionIds.filter(id => !existing.includes(id));

    const newItems = toAdd.map((id, i) => ({
      question: id,
      order: mt.questions.length + i + 1,
      section: section || 'General',
      marks: marks || 1,
      negativeMarks: negativeMarks !== undefined ? negativeMarks : 0.25,
    }));

    mt.questions.push(...newItems);
    mt.completedQuestions = mt.questions.length;
    mt.totalQuestions = mt.questions.length;
    mt.totalMarks = mt.questions.length * 1;
    await mt.save();

    emitEvent('mocktests_updated', { action: 'update', data: mt });

    res.json({ success: true, data: mt, message: `${toAdd.length} questions added` });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove question from mock test
// @route   DELETE /api/mocktests/:id/questions/:questionId
exports.removeQuestion = async (req, res, next) => {
  try {
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });

    const qIdStr = req.params.questionId;
    mt.questions = mt.questions.filter(q => {
      const targetId = (q.question?._id || q.question || q._id).toString();
      const subDocId = q._id ? q._id.toString() : '';
      return targetId !== qIdStr && subDocId !== qIdStr;
    });
    mt.completedQuestions = mt.questions.length;
    mt.totalQuestions = mt.questions.length;
    mt.totalMarks = mt.questions.length * 1;
    await mt.save();

    emitEvent('mocktests_updated', { action: 'update', data: mt });

    res.json({ success: true, data: mt, message: 'Question removed' });
  } catch (err) {
    next(err);
  }
};

// @desc    Reorder questions (drag-drop)
// @route   PATCH /api/mocktests/:id/questions/reorder
exports.reorderQuestions = async (req, res, next) => {
  try {
    const { orderedIds } = req.body; // array of question _ids in new order
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });

    const map = {};
    mt.questions.forEach(q => { map[q.question.toString()] = q; });

    mt.questions = orderedIds.map((id, i) => ({ ...map[id]?.toObject(), order: i + 1 }));
    await mt.save();

    emitEvent('mocktests_updated', { action: 'update', data: mt });

    res.json({ success: true, data: mt });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete
// @route   DELETE /api/mocktests/bulk
exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await MockTest.deleteMany({ _id: { $in: ids } });
    emitEvent('mocktests_updated', { action: 'delete', ids });
    res.json({ success: true, message: `${ids.length} mock tests deleted` });
  } catch (err) {
    next(err);
  }
};

// @desc    Add direct custom question to mock test
// @route   POST /api/mocktests/:id/questions/direct
exports.addDirectQuestion = async (req, res, next) => {
  try {
    const Question = require('../models/Question');
    const { questionText, options, correctAnswer, explanation, section, marks, negativeMarks } = req.body;
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });

    const newQ = await Question.create({
      questionText,
      options,
      correctAnswer,
      explanation,
      section: section || 'General',
      marks: marks || 1,
      negativeMarks: negativeMarks !== undefined ? negativeMarks : (mt.negativeMarking || 0.25),
      createdBy: req.user._id,
      status: 'published',
    });

    mt.questions.push({
      question: newQ._id,
      order: mt.questions.length + 1,
      section: section || 'General',
      marks: marks || 1,
      negativeMarks: negativeMarks !== undefined ? negativeMarks : (mt.negativeMarking || 0.25),
    });
    mt.completedQuestions = mt.questions.length;
    mt.totalQuestions = mt.questions.length;
    mt.totalMarks = mt.questions.length * 1;
    await mt.save();

    emitEvent('mocktests_updated', { action: 'update', data: mt });

    const updatedMt = await MockTest.findById(req.params.id).populate('questions.question');
    res.status(201).json({ success: true, data: updatedMt, message: 'Custom question added successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public 2-level mock tests tree (Exams -> Tests)
// @route   GET /api/mocktests/public/tree
exports.getPublicMockTestsTree = async (req, res, next) => {
  try {
    const exams = await Examination.find({ status: { $ne: 'inactive' } }).sort('name');
    const allTests = await MockTest.find({ status: { $nin: ['archived', 'deactivated', 'disabled', 'draft'] } })
      .populate('examination', 'name color icon')
      .sort('-createdAt');

    // Group tests by examination
    const examMap = new Map();

    exams.forEach(ex => {
      examMap.set(ex._id.toString(), {
        _id: ex._id,
        category: ex.name,
        name: ex.name,
        description: ex.description || '',
        icon: ex.icon || 'landmark',
        color: ex.color || '#7C3AED',
        bg: ex.bg || '#F3ECFE',
        price: ex.price || 0,
        status: ex.status || 'active',
        topics: ex.topics || [],
        tests: []
      });
    });

    await Promise.all(allTests.map(async (t) => {
      if (!t.questions || t.questions.length === 0) {
        await ensureMockTestQuestions(t);
      }
      const realQCount = Array.isArray(t.questions) ? t.questions.length : (t.completedQuestions || 0);
      const isFull = t.testType === 'full_length' || realQCount >= 100;
      const isComingSoon = (t.status === 'scheduled' || t.status === 'coming_soon') && t.publishAt && new Date(t.publishAt) > new Date();
      const testObj = {
        _id: t._id,
        title: t.name || t.title,
        type: isFull ? 'full_length' : 'sectional',
        marks: realQCount * 1,
        qs: realQCount,
        mins: t.duration || (isFull ? 120 : 60),
        diff: t.difficulty || 'Medium',
        free: t.pricingType === 'free' || t.accessType === 'Free' || t.price === 0,
        price: t.price || 0,
        accessType: t.accessType || (t.price > 0 ? 'Premium' : 'Free'),
        status: t.status,
        publishAt: t.publishAt,
        subTopic: t.subTopic,
        topicName: t.topicName,
        isComingSoon: Boolean(isComingSoon)
      };

      const exId = t.examination?._id ? t.examination._id.toString() : (t.examination ? t.examination.toString() : null);
      if (exId && examMap.has(exId)) {
        examMap.get(exId).tests.push(testObj);
      } else {
        // Fallback matching by name
        for (const catObj of examMap.values()) {
          if (t.examination?.name && catObj.category.toLowerCase().includes(t.examination.name.toLowerCase())) {
            catObj.tests.push(testObj);
            break;
          }
        }
      }
    }));

    const categoriesList = Array.from(examMap.values());
    res.json({ success: true, data: categoriesList });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk publish
// @route   PATCH /api/mocktests/bulk-publish
exports.bulkPublish = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await MockTest.updateMany({ _id: { $in: ids } }, { status: 'published' });
    res.json({ success: true, message: 'Mock tests published' });
  } catch (err) { next(err); }
};

// @desc    Publish single mock test
// @route   PATCH /api/mocktests/:id/publish
exports.publishMockTest = async (req, res, next) => {
  try {
    const mt = await MockTest.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
    res.json({ success: true, data: mt });
  } catch (err) { next(err); }
};

// @desc    Duplicate mock test
// @route   POST /api/mocktests/:id/duplicate
exports.duplicateMockTest = async (req, res, next) => {
  try {
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });
    const dupData = { ...mt.toObject(), _id: undefined, name: `${mt.name} (Copy)` };
    const dup = await MockTest.create(dupData);
    res.status(201).json({ success: true, data: dup });
  } catch (err) { next(err); }
};

// @desc    Schedule mock test
// @route   PATCH /api/mocktests/:id/schedule
exports.scheduleMockTest = async (req, res, next) => {
  try {
    const mt = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: mt });
  } catch (err) { next(err); }
};

