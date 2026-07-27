const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const Examination = require('../models/Examination');
const { paginate, paginateResponse } = require('../utils/pagination');

// @desc    Get all mock tests
// @route   GET /api/mocktests
exports.getMockTests = async (req, res, next) => {
  try {
    const { search, status, examination, pricingType, page = 1, limit = 10, sort = '-createdAt' } = req.query;
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
        .populate('createdBy', 'name')
        .select('-questions'),
      MockTest.countDocuments(filter),
    ]);

    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
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

    // Filter out deleted questions from Question Bank automatically
    if (Array.isArray(mt.questions)) {
      const validQuestions = mt.questions.filter(qItem => qItem.question !== null && qItem.question !== undefined);
      if (validQuestions.length !== mt.questions.length) {
        mt.questions = validQuestions;
        mt.completedQuestions = validQuestions.length;
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
    const mt = await MockTest.create({ ...req.body, createdBy: req.user._id });

    // Increment exam mock test count
    await Examination.findByIdAndUpdate(mt.examination, { $inc: { mockTestsCount: 1 } });

    res.status(201).json({ success: true, data: mt });
  } catch (err) {
    next(err);
  }
};

// @desc    Update mock test
// @route   PUT /api/mocktests/:id
exports.updateMockTest = async (req, res, next) => {
  try {
    const mt = await MockTest.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('examination', 'name');

    if (!mt) return res.status(404).json({ success: false, message: 'Mock test not found' });
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
    await mt.save();

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

    mt.questions = mt.questions.filter(q => q.question.toString() !== req.params.questionId);
    mt.completedQuestions = mt.questions.length;
    await mt.save();

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
    await mt.save();

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
    const allTests = await MockTest.find({ status: { $ne: 'archived' } })
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

    allTests.forEach(t => {
      const exId = t.examination?._id ? t.examination._id.toString() : (t.examination ? t.examination.toString() : null);
      const isFull = t.testType === 'full_length' || (t.totalMarks && t.totalMarks >= 100);
      const testObj = {
        _id: t._id,
        title: t.name || t.title,
        type: isFull ? 'full_length' : 'sectional',
        marks: t.totalMarks || (isFull ? 100 : 50),
        qs: t.questions?.length || t.totalQuestions || (isFull ? 100 : 50),
        mins: t.duration || (isFull ? 120 : 60),
        diff: t.difficulty || 'Medium',
        free: t.pricingType === 'free' || t.accessType === 'Free' || t.price === 0,
        price: t.price || 0,
        accessType: t.accessType || (t.price > 0 ? 'Premium' : 'Free')
      };

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
    });

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

