const mongoose = require('mongoose');

// Singleton document — there is only ever ONE OdishaExamConfig in the DB
const odishaExamConfigSchema = new mongoose.Schema({
  bannerEyebrow:  { type: String, default: 'Exam Section' },
  bannerHeading:  { type: String, default: 'Browse All Competitive Exams' },
  bannerSubtitle: { type: String, default: 'Find your target exam category and get structured preparation resources — tests, PDFs & live classes.' },
  bannerStats: {
    type: [{ n: String, label: String }],
    default: [
      { n: '50+', label: 'Exams Covered' },
      { n: '6', label: 'Categories' },
      { n: '10K+', label: 'Students' },
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model('OdishaExamConfig', odishaExamConfigSchema);
