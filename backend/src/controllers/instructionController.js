const SubjectTestInstruction = require('../models/SubjectTestInstruction');
const Subject = require('../models/Subject');
const { emitEvent } = require('../utils/socket');

// @desc    Get all instructions with filters
// @route   GET /api/instructions
exports.getInstructions = async (req, res, next) => {
  try {
    const { search, subjectId, subjectName, topicName, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subjectName: { $regex: search, $options: 'i' } },
        { topicName: { $regex: search, $options: 'i' } },
        { subTopic: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    if (subjectId && subjectId !== 'all') {
      filter.subjectId = subjectId;
    } else if (subjectName && subjectName !== 'all' && subjectName !== 'All Subjects') {
      filter.subjectName = new RegExp(`^${subjectName.trim()}$`, 'i');
    }

    if (topicName && topicName !== 'all' && topicName !== 'All Topics') {
      filter.topicName = new RegExp(`^${topicName.trim()}$`, 'i');
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      SubjectTestInstruction.find(filter)
        .populate('subjectId', 'name icon color')
        .populate('createdBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      SubjectTestInstruction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single instruction by ID
// @route   GET /api/instructions/:id
exports.getInstruction = async (req, res, next) => {
  try {
    const instruction = await SubjectTestInstruction.findById(req.params.id)
      .populate('subjectId', 'name icon color topicList');

    if (!instruction) {
      return res.status(404).json({ success: false, message: 'Instruction not found' });
    }

    res.json({ success: true, data: instruction });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new instruction for Subject / Topic / Sub-topic
// @route   POST /api/instructions
exports.createInstruction = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // Resolve subject name if subjectId is provided
    if (payload.subjectId && payload.subjectId !== 'all' && payload.subjectId !== '') {
      const subj = await Subject.findById(payload.subjectId);
      if (subj) {
        payload.subjectName = subj.name;
      }
    } else {
      payload.subjectId = null;
      if (!payload.subjectName) payload.subjectName = 'All Subjects';
    }

    if (!payload.topicName || payload.topicName === 'all') {
      payload.topicName = 'All Topics';
    }

    // Clean instructions array
    if (Array.isArray(payload.instructions)) {
      payload.instructions = payload.instructions.filter(str => typeof str === 'string' && str.trim().length > 0);
    } else if (typeof payload.instructions === 'string') {
      payload.instructions = payload.instructions.split('\n').filter(s => s.trim().length > 0);
    }

    if (!payload.instructions || payload.instructions.length === 0) {
      payload.instructions = [
        'Read all questions carefully before choosing your answer.',
        'Each question has only one correct answer option.',
        'Negative marking applies for incorrect attempts if configured.',
        'Do not refresh or close the browser page during the active test session.',
        'The timer counts down continuously once the exam begins.',
        'Submit your test before the remaining time reaches 00:00.'
      ];
    }

    const newInstruction = await SubjectTestInstruction.create({
      ...payload,
      createdBy: req.user?._id || undefined,
    });

    emitEvent('instructions_updated', { action: 'create', data: newInstruction });

    res.status(201).json({ success: true, data: newInstruction, message: 'Instruction created successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Update instruction
// @route   PUT /api/instructions/:id
exports.updateInstruction = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // Resolve subject name if subjectId changed
    if (payload.subjectId && payload.subjectId !== 'all' && payload.subjectId !== '') {
      const subj = await Subject.findById(payload.subjectId);
      if (subj) {
        payload.subjectName = subj.name;
      }
    } else if (payload.subjectId === 'all' || payload.subjectId === null) {
      payload.subjectId = null;
      if (!payload.subjectName) payload.subjectName = 'All Subjects';
    }

    if (Array.isArray(payload.instructions)) {
      payload.instructions = payload.instructions.filter(str => typeof str === 'string' && str.trim().length > 0);
    } else if (typeof payload.instructions === 'string') {
      payload.instructions = payload.instructions.split('\n').filter(s => s.trim().length > 0);
    }

    const updated = await SubjectTestInstruction.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name icon color');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Instruction not found' });
    }

    emitEvent('instructions_updated', { action: 'update', data: updated });

    res.json({ success: true, data: updated, message: 'Instruction updated successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete instruction
// @route   DELETE /api/instructions/:id
exports.deleteInstruction = async (req, res, next) => {
  try {
    const doc = await SubjectTestInstruction.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Instruction not found' });
    }

    emitEvent('instructions_updated', { action: 'delete', id: req.params.id });

    res.json({ success: true, message: 'Instruction deleted successfully' });
  } catch (err) {
    next(err);
  }
};
