const Certificate = require('../models/Certificate');
const MockTest    = require('../models/MockTest');
const User        = require('../models/User');

/* ─── GENERATE / GET CERTIFICATE ─── */
const generateCertificate = async (req, res) => {
  try {
    const { userId, mockTestId, courseId, score, totalMarks } = req.body;

    if (!userId || !score || !totalMarks)
      return res.status(400).json({ message: 'userId, score, totalMarks required' });

    const percentage = parseFloat(((score / totalMarks) * 100).toFixed(2));

    // Check if already generated
    const existing = await Certificate.findOne({ user: userId, mockTest: mockTestId || null });
    if (existing) return res.json(existing);

    const cert = new Certificate({
      user: userId, mockTest: mockTestId, course: courseId,
      score, totalMarks, percentage
    });
    await cert.save();
    res.status(201).json(cert);
  } catch (err) {
    console.error('generateCertificate error:', err);
    res.status(500).json({ message: 'Error generating certificate' });
  }
};

/* ─── GET USER CERTIFICATES ─── */
const getUserCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.params.userId })
      .populate('mockTest', 'testName')
      .populate('course', 'title')
      .sort({ issuedAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching certificates' });
  }
};

/* ─── VERIFY CERTIFICATE (public) ─── */
const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateNumber: req.params.certNumber })
      .populate('user', 'name email')
      .populate('mockTest', 'testName')
      .populate('course', 'title');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json({ valid: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying certificate' });
  }
};

/* ─── GET ALL CERTIFICATES (admin) ─── */
const getAllCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find()
      .populate('user', 'name email')
      .populate('mockTest', 'testName')
      .populate('course', 'title')
      .sort({ issuedAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching certificates' });
  }
};

module.exports = { generateCertificate, getUserCertificates, verifyCertificate, getAllCertificates };
