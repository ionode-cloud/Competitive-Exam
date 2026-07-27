const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const SubChapter = require('../models/SubChapter');
const { paginate, paginateResponse } = require('../utils/pagination');

// ===== SUBJECTS =====

exports.getSubjects = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 100, sort = 'order createdAt' } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Subject.find(filter).sort(sort).skip(skip).limit(lim).populate('createdBy', 'name'),
      Subject.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('createdBy', 'name');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
};

exports.createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: subject });
  } catch (err) { next(err); }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
};

exports.reorderSubjects = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (Array.isArray(orderedIds)) {
      const ops = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { order: index },
        },
      }));
      await Subject.bulkWrite(ops);
    }
    res.json({ success: true, message: 'Subject order updated successfully' });
  } catch (err) { next(err); }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const SubjectTestSubject = require('../models/SubjectTestSubject');
    const Question = require('../models/Question');
    const targetId = req.params.id;

    const mainSub = await Subject.findById(targetId);
    let subName = mainSub?.name;

    if (mainSub) {
      await Chapter.deleteMany({ subject: mainSub._id });
      await SubChapter.deleteMany({ subject: mainSub._id });
      await Question.deleteMany({ subject: mainSub._id });
      await mainSub.deleteOne();
    }

    let stSub = await SubjectTestSubject.findById(targetId);
    if (!stSub && subName) {
      stSub = await SubjectTestSubject.findOne({ name: { $regex: new RegExp(`^${subName.trim()}$`, 'i') } });
    }
    if (stSub) {
      await stSub.deleteOne();
    }

    if (!mainSub && !stSub) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.json({ success: true, message: 'Subject deleted successfully from all modules' });
  } catch (err) { next(err); }
};

exports.getSubjectsDropdown = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ status: 'active' })
      .select('name description icon color order showInPyqEbook status topics _id')
      .sort('order createdAt name');
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
};

// ===== CHAPTERS =====

exports.getChapters = async (req, res, next) => {
  try {
    const { subject, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Chapter.find(filter).sort('order name').skip(skip).limit(lim).populate('subject', 'name'),
      Chapter.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.createChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.create({ ...req.body, createdBy: req.user._id });
    await Subject.findByIdAndUpdate(chapter.subject, { $inc: { chapterCount: 1 } });
    res.status(201).json({ success: true, data: chapter });
  } catch (err) { next(err); }
};

exports.updateChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    res.json({ success: true, data: chapter });
  } catch (err) { next(err); }
};

exports.deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    await Subject.findByIdAndUpdate(chapter.subject, { $inc: { chapterCount: -1 } });
    await chapter.deleteOne();
    res.json({ success: true, message: 'Chapter deleted' });
  } catch (err) { next(err); }
};

// ===== SUBCHAPTERS =====

exports.getSubChapters = async (req, res, next) => {
  try {
    const { chapter, subject, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (chapter) filter.chapter = chapter;
    if (subject) filter.subject = subject;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      SubChapter.find(filter).sort('order name').skip(skip).limit(lim)
        .populate('chapter', 'name').populate('subject', 'name'),
      SubChapter.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.createSubChapter = async (req, res, next) => {
  try {
    const sc = await SubChapter.create({ ...req.body, createdBy: req.user._id });
    await Chapter.findByIdAndUpdate(sc.chapter, { $inc: { subChapterCount: 1 } });
    res.status(201).json({ success: true, data: sc });
  } catch (err) { next(err); }
};

exports.updateSubChapter = async (req, res, next) => {
  try {
    const sc = await SubChapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sc) return res.status(404).json({ success: false, message: 'Sub-chapter not found' });
    res.json({ success: true, data: sc });
  } catch (err) { next(err); }
};

exports.deleteSubChapter = async (req, res, next) => {
  try {
    const sc = await SubChapter.findById(req.params.id);
    if (!sc) return res.status(404).json({ success: false, message: 'Sub-chapter not found' });
    await Chapter.findByIdAndUpdate(sc.chapter, { $inc: { subChapterCount: -1 } });
    await sc.deleteOne();
    res.json({ success: true, message: 'Sub-chapter deleted' });
  } catch (err) { next(err); }
};

// Chapter tree (hierarchical view for question bank)
exports.getChapterTree = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const chapters = await Chapter.find({ subject: subjectId }).sort('order name').lean();
    const subChapters = await SubChapter.find({ subject: subjectId }).sort('order name').lean();

    const tree = chapters.map(ch => ({
      ...ch,
      subChapters: subChapters.filter(sc => sc.chapter.toString() === ch._id.toString()),
    }));

    res.json({ success: true, data: tree });
  } catch (err) { next(err); }
};
