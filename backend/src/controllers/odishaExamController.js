const OdishaExam = require('../models/OdishaExam');
const Examination = require('../models/Examination');
const MockTest = require('../models/MockTest');
const { paginate, paginateResponse } = require('../utils/pagination');

exports.getOdishaExams = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { examinationName: { $regex: search, $options: 'i' } },
        { mockTestName: { $regex: search, $options: 'i' } },
      ];
    }

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      OdishaExam.find(filter).sort(sort).skip(skip).limit(lim),
      OdishaExam.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.getDropdownOptions = async (req, res, next) => {
  try {
    const examinations = await Examination.distinct('name');
    const mockTests = await MockTest.distinct('name');
    const existingOdishaExams = await OdishaExam.find().select('examinationName mockTestName').lean();

    const existingExamNames = Array.from(new Set([
      'OSSSC', 'OPSC', 'OSSC', 'Odisha Police', 'UPSC',
      ...examinations,
      ...existingOdishaExams.map(e => e.examinationName)
    ])).filter(Boolean);

    const existingMockNames = Array.from(new Set([
      'RI_2026', 'ARI_2026', 'AMIN_2026', 'PEO_2026', 'CGL_Mock_01',
      ...mockTests,
      ...existingOdishaExams.map(e => e.mockTestName)
    ])).filter(Boolean);

    res.json({
      success: true,
      data: {
        examinationNames: existingExamNames,
        mockTestNames: existingMockNames,
      }
    });
  } catch (err) { next(err); }
};

exports.createOdishaExam = async (req, res, next) => {
  try {
    const { examinationName, mockTestName, price } = req.body;
    if (!examinationName || !mockTestName) {
      return res.status(400).json({ success: false, message: 'Examination Name and Mock Test Name are required' });
    }

    const existing = await OdishaExam.findOne({
      examinationName: { $regex: new RegExp(`^${examinationName.trim()}$`, 'i') },
      mockTestName: { $regex: new RegExp(`^${mockTestName.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Odisha Exam entry for "${examinationName} - ${mockTestName}" already exists!` });
    }

    const odishaExam = await OdishaExam.create({
      examinationName: examinationName.trim(),
      mockTestName: mockTestName.trim(),
      price: Number(price) || 0,
      createdBy: req.user._id,
    });

    // Also sync Examination model if doesn't exist
    await Examination.findOneAndUpdate(
      { name: examinationName.trim() },
      { $setOnInsert: { name: examinationName.trim(), price: Number(price) || 0 } },
      { upsert: true }
    );

    res.status(201).json({ success: true, data: odishaExam, message: 'Odisha Exam created successfully' });
  } catch (err) { next(err); }
};

exports.updateOdishaExam = async (req, res, next) => {
  try {
    const { examinationName, mockTestName, price } = req.body;
    const odishaExam = await OdishaExam.findById(req.params.id);
    if (!odishaExam) return res.status(404).json({ success: false, message: 'Odisha Exam entry not found' });

    if (examinationName) odishaExam.examinationName = examinationName.trim();
    if (mockTestName) odishaExam.mockTestName = mockTestName.trim();
    if (price !== undefined) odishaExam.price = Number(price);

    await odishaExam.save();
    res.json({ success: true, data: odishaExam, message: 'Odisha Exam updated successfully' });
  } catch (err) { next(err); }
};

exports.deleteOdishaExam = async (req, res, next) => {
  try {
    const odishaExam = await OdishaExam.findById(req.params.id);
    if (!odishaExam) return res.status(404).json({ success: false, message: 'Odisha Exam entry not found' });
    await odishaExam.deleteOne();
    res.json({ success: true, message: 'Odisha Exam deleted successfully' });
  } catch (err) { next(err); }
};
