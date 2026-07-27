const EBook = require('../models/EBook');
const Subject = require('../models/Subject');
const { paginate, paginateResponse } = require('../utils/pagination');
const path = require('path');
const mongoose = require('mongoose');

exports.getEBooks = async (req, res, next) => {
  try {
    const { search, subject, category, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (subject) filter.subject = subject;
    if (category && category !== 'All') filter.category = category;
    if (status) filter.status = status;
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      EBook.find(filter).sort(sort).skip(skip).limit(lim).populate('subject', 'name').populate('createdBy', 'name'),
      EBook.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.getEBook = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid EBook ID' });
    }
    const ebook = await EBook.findById(req.params.id).populate('subject', 'name').populate('createdBy', 'name');
    if (!ebook) return res.status(404).json({ success: false, message: 'EBook not found' });
    res.json({ success: true, data: ebook });
  } catch (err) { next(err); }
};

const resolveSubjectId = async (subjInput, createdBy) => {
  if (!subjInput) return null;
  if (mongoose.Types.ObjectId.isValid(subjInput)) return subjInput;
  const trimmed = String(subjInput).trim();
  if (!trimmed) return null;
  let subjDoc = await Subject.findOne({ name: { $regex: new RegExp(`^${trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } });
  if (!subjDoc) {
    subjDoc = await Subject.create({ name: trimmed, createdBy });
  }
  return subjDoc._id;
};

exports.createEBook = async (req, res, next) => {
  try {
    const ebookData = { ...req.body, createdBy: req.user._id };

    if (ebookData.subject) {
      ebookData.subject = await resolveSubjectId(ebookData.subject, req.user._id);
    }

    if (typeof req.body.tags === 'string') {
      ebookData.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (req.body['instructions[]']) {
      ebookData.instructions = Array.isArray(req.body['instructions[]']) ? req.body['instructions[]'] : [req.body['instructions[]']];
    } else if (Array.isArray(req.body.instructions)) {
      ebookData.instructions = req.body.instructions.filter(Boolean);
    }

    if (req.files?.pdf?.[0]) {
      ebookData.pdfUrl = `${req.protocol}://${req.get('host')}/uploads/pdfs/${path.basename(req.files.pdf[0].path)}`;
      ebookData.fileSize = req.files.pdf[0].size;
    }
    if (req.files?.thumbnail?.[0]) {
      ebookData.thumbnail = `${req.protocol}://${req.get('host')}/uploads/images/${path.basename(req.files.thumbnail[0].path)}`;
    }

    const ebook = await EBook.create(ebookData);
    res.status(201).json({ success: true, data: ebook });
  } catch (err) { next(err); }
};

exports.updateEBook = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    if (updateData.subject) {
      updateData.subject = await resolveSubjectId(updateData.subject, req.user._id);
    }

    if (typeof req.body.tags === 'string') {
      updateData.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (req.body['instructions[]']) {
      updateData.instructions = Array.isArray(req.body['instructions[]']) ? req.body['instructions[]'] : [req.body['instructions[]']];
    } else if (Array.isArray(req.body.instructions)) {
      updateData.instructions = req.body.instructions.filter(Boolean);
    }

    if (req.files?.pdf?.[0]) {
      updateData.pdfUrl = `${req.protocol}://${req.get('host')}/uploads/pdfs/${path.basename(req.files.pdf[0].path)}`;
      updateData.fileSize = req.files.pdf[0].size;
    }
    if (req.files?.thumbnail?.[0]) {
      updateData.thumbnail = `${req.protocol}://${req.get('host')}/uploads/images/${path.basename(req.files.thumbnail[0].path)}`;
    }
    const ebook = await EBook.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!ebook) return res.status(404).json({ success: false, message: 'EBook not found' });
    res.json({ success: true, data: ebook });
  } catch (err) { next(err); }
};

exports.deleteEBook = async (req, res, next) => {
  try {
    const ebook = await EBook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ success: false, message: 'EBook not found' });
    await ebook.deleteOne();
    res.json({ success: true, message: 'EBook deleted' });
  } catch (err) { next(err); }
};

exports.getPublicEBooks = async (req, res, next) => {
  try {
    const { search, subject, category } = req.query;
    const filter = { status: 'published' };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (subject) filter.subject = subject;
    if (category && category !== 'All') filter.category = category;
    const data = await EBook.find(filter).sort('-createdAt').populate('subject', 'name');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.incrementDownload = async (req, res, next) => {
  try {
    const ebook = await EBook.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } }, { new: true });
    res.json({ success: true, data: ebook });
  } catch (err) { next(err); }
};
