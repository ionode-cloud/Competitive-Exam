const Question = require('../models/Question');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const SubChapter = require('../models/SubChapter');
const XLSX = require('xlsx');
const { paginate, paginateResponse } = require('../utils/pagination');
const SubjectTestQuestionMap = require('../models/SubjectTestQuestionMap');
const SubjectTest = require('../models/SubjectTest');
const MockTest = require('../models/MockTest');

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

// @desc    Get all questions with filters
// @route   GET /api/questions
exports.getQuestions = async (req, res, next) => {
  try {
    const { search, subject, chapter, subChapter, difficulty, status, source, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = {};
    if (search) filter.questionText = { $regex: search, $options: 'i' };
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;
    if (subChapter) filter.subChapter = subChapter;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (source) filter.source = source;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Question.find(filter).sort(sort).skip(skip).limit(lim)
        .populate('subject', 'name')
        .populate('chapter', 'name')
        .populate('subChapter', 'name')
        .populate('createdBy', 'name'),
      Question.countDocuments(filter),
    ]);

    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single question
// @route   GET /api/questions/:id
exports.getQuestion = async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id)
      .populate('subject chapter subChapter createdBy', 'name email');
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

// @desc    Create question
// @route   POST /api/questions
exports.createQuestion = async (req, res, next) => {
  try {
    if (Array.isArray(req.body)) {
      const docs = req.body.map(item => ({ ...item, createdBy: req.user._id }));
      const questions = await Question.insertMany(docs);
      res.status(201).json({ success: true, count: questions.length, data: questions });
      return;
    }
    const question = await Question.create({ ...req.body, createdBy: req.user._id });

    // Update counts
    if (question.subject) await Subject.findByIdAndUpdate(question.subject, { $inc: { questionCount: 1 } });
    if (question.chapter) await Chapter.findByIdAndUpdate(question.chapter, { $inc: { questionCount: 1 } });
    if (question.subChapter) await SubChapter.findByIdAndUpdate(question.subChapter, { $inc: { questionCount: 1 } });

    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
exports.updateQuestion = async (req, res, next) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
exports.deleteQuestion = async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });

    if (q.subject) await Subject.findByIdAndUpdate(q.subject, { $inc: { questionCount: -1 } });
    if (q.chapter) await Chapter.findByIdAndUpdate(q.chapter, { $inc: { questionCount: -1 } });
    if (q.subChapter) await SubChapter.findByIdAndUpdate(q.subChapter, { $inc: { questionCount: -1 } });

    await syncQuestionDeletionWithTests([q._id]);
    await q.deleteOne();
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Duplicate question
// @route   POST /api/questions/:id/duplicate
exports.duplicateQuestion = async (req, res, next) => {
  try {
    const original = await Question.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Question not found' });

    const copy = original.toObject();
    delete copy._id;
    copy.status = 'draft';
    copy.isDuplicate = true;
    copy.originalQuestion = original._id;
    copy.createdBy = req.user._id;
    copy.attemptCount = 0;
    copy.correctCount = 0;

    const newQ = await Question.create(copy);
    res.status(201).json({ success: true, data: newQ });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete
// @route   DELETE /api/questions/bulk
exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      await syncQuestionDeletionWithTests(ids);
      await Question.deleteMany({ _id: { $in: ids } });
    }
    res.json({ success: true, message: `${ids?.length || 0} questions deleted` });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk publish
// @route   PATCH /api/questions/bulk-publish
exports.bulkPublish = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await Question.updateMany({ _id: { $in: ids } }, { status: 'published' });
    res.json({ success: true, message: `${ids.length} questions published` });
  } catch (err) {
    next(err);
  }
};

// @desc    Import questions from Excel/CSV
// @route   POST /api/questions/import
exports.importQuestions = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const importBatch = `IMPORT-${Date.now()}`;
    const questions = rows.map(row => ({
      questionText: row['Question'] || row['question'],
      options: [
        { label: 'A', text: row['Option A'] || row['option_a'] || '' },
        { label: 'B', text: row['Option B'] || row['option_b'] || '' },
        { label: 'C', text: row['Option C'] || row['option_c'] || '' },
        { label: 'D', text: row['Option D'] || row['option_d'] || '' },
      ],
      correctAnswer: (row['Correct Answer'] || row['correct_answer'] || 'A').toUpperCase(),
      explanation: row['Explanation'] || row['explanation'] || '',
      difficulty: (row['Difficulty'] || row['difficulty'] || 'moderate').toLowerCase(),
      marks: parseFloat(row['Marks'] || row['marks'] || 1),
      negativeMarks: parseFloat(row['Negative Marks'] || row['negative_marks'] || 0.25),
      section: row['Section'] || row['section'] || 'General',
      source: 'import',
      importBatch,
      status: 'draft',
      createdBy: req.user._id,
    }));

    const inserted = await Question.insertMany(questions, { ordered: false });
    res.json({ success: true, message: `${inserted.length} questions imported`, importBatch });
  } catch (err) {
    next(err);
  }
};

// @desc    Export questions template
// @route   GET /api/questions/export-template
exports.exportTemplate = async (req, res, next) => {
  try {
    const template = [
      {
        Question: 'Sample question text?',
        'Option A': 'Option 1',
        'Option B': 'Option 2',
        'Option C': 'Option 3',
        'Option D': 'Option 4',
        'Correct Answer': 'A',
        Explanation: 'Explanation text here',
        Difficulty: 'easy',
        Section: 'General',
        Marks: 1,
        'Negative Marks': 0.25,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=questions_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Move questions to different chapter/subchapter
// @route   PATCH /api/questions/move
exports.moveQuestions = async (req, res, next) => {
  try {
    const { ids, subject, chapter, subChapter } = req.body;
    const updateData = {};
    if (subject) updateData.subject = subject;
    if (chapter) updateData.chapter = chapter;
    if (subChapter) updateData.subChapter = subChapter;
    await Question.updateMany({ _id: { $in: ids } }, updateData);
    res.json({ success: true, message: `${ids.length} questions moved` });
  } catch (err) {
    next(err);
  }
};
