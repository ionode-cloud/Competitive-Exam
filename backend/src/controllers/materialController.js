const Material = require('../models/Material');
const Subject  = require('../models/Subject');
const { paginate, paginateResponse } = require('../utils/pagination');
const path = require('path');
const mongoose = require('mongoose');

// ─── Public (no-auth) ────────────────────────────────────────────────────────
exports.getPublicMaterials = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const filter = { status: 'published' };
    if (search)   filter.title    = { $regex: search, $options: 'i' };
    if (category && category !== 'All') filter.category = category;
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Material.find(filter).sort('-createdAt').skip(skip).limit(lim).populate('subject', 'name'),
      Material.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.getMaterials = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (search)   filter.title    = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Material.find(filter).sort(sort).skip(skip).limit(lim).populate('createdBy', 'name').populate('subject', 'name'),
      Material.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.getMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate('createdBy', 'name').populate('subject', 'name');
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, data: material });
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

exports.createMaterial = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };

    if (data.subject) {
      data.subject = await resolveSubjectId(data.subject, req.user._id);
    }

    if (req.files?.pdf?.[0]) {
      data.pdfUrl  = `${req.protocol}://${req.get('host')}/uploads/pdfs/${path.basename(req.files.pdf[0].path)}`;
      data.fileSize = req.files.pdf[0].size;
    }
    if (req.files?.thumbnail?.[0]) {
      data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/images/${path.basename(req.files.thumbnail[0].path)}`;
    }

    const material = await Material.create(data);
    res.status(201).json({ success: true, data: material });
  } catch (err) { next(err); }
};

exports.updateMaterial = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.subject) {
      updateData.subject = await resolveSubjectId(updateData.subject, req.user._id);
    }
    if (req.files?.pdf?.[0]) {
      updateData.pdfUrl  = `${req.protocol}://${req.get('host')}/uploads/pdfs/${path.basename(req.files.pdf[0].path)}`;
      updateData.fileSize = req.files.pdf[0].size;
    }
    if (req.files?.thumbnail?.[0]) {
      updateData.thumbnail = `${req.protocol}://${req.get('host')}/uploads/images/${path.basename(req.files.thumbnail[0].path)}`;
    }
    const material = await Material.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
};

exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    await material.deleteOne();
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) { next(err); }
};

exports.incrementDownload = async (req, res, next) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } }, { new: true });
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
};
