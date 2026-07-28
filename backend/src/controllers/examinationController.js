const Examination = require('../models/Examination');
const MockTest = require('../models/MockTest');
const { paginate, paginateResponse } = require('../utils/pagination');
const { emitEvent } = require('../utils/socket');

// @desc    Get all examinations
// @route   GET /api/examinations
exports.getExaminations = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Examination.find(filter).sort(sort).skip(skip).limit(lim).populate('createdBy', 'name'),
      Examination.countDocuments(filter),
    ]);

    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single examination
// @route   GET /api/examinations/:id
exports.getExamination = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id).populate('createdBy', 'name email');
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};

// @desc    Create examination
// @route   POST /api/examinations
exports.createExamination = async (req, res, next) => {
  try {
    const { _id, __v, createdAt, updatedAt, ...createData } = req.body;
    const exam = await Examination.create({ ...createData, createdBy: req.user?._id });
    emitEvent('exams_updated', { action: 'create', data: exam });

    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An examination category with this name already exists' });
    }
    next(err);
  }
};

// @desc    Update examination
// @route   PUT /api/examinations/:id
exports.updateExamination = async (req, res, next) => {
  try {
    const { _id, __v, createdAt, updatedAt, ...updateData } = req.body;
    const exam = await Examination.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true,
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    emitEvent('exams_updated', { action: 'update', data: exam });

    res.json({ success: true, data: exam });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An examination category with this name already exists' });
    }
    next(err);
  }
};

// @desc    Delete examination
// @route   DELETE /api/examinations/:id
exports.deleteExamination = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });

    // Check if mock tests exist
    const mtCount = await MockTest.countDocuments({ examination: exam._id });
    if (mtCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${mtCount} mock test(s) linked to this examination`,
      });
    }

    await exam.deleteOne();
    res.json({ success: true, message: 'Examination deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all names (for dropdowns)
// @route   GET /api/examinations/dropdown
exports.getDropdown = async (req, res, next) => {
  try {
    const exams = await Examination.find({ status: 'active' }).select('name _id').sort('name');
    res.json({ success: true, data: exams });
  } catch (err) {
    next(err);
  }
};
