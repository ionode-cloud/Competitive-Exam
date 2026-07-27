const mongoose = require('mongoose');

// Singleton document — there is only ever ONE SubjectTestConfig in the DB
const subjectTestConfigSchema = new mongoose.Schema({
  /* ─── Hero Banner Settings ────────────────────────── */
  bannerEyebrow:  { type: String, default: 'Subject Test' },
  bannerHeading:  { type: String, default: 'Subject-Wise Practice Tests' },
  bannerSubtitle: { type: String, default: 'Master every topic with focused subject tests — free & premium options for all Odisha exams.' },
  bannerStats: {
    type: [{ n: String, label: String }],
    default: [
      { n: '6',  label: 'Subjects' },
      { n: '24+', label: 'Practice Tests' },
      { n: '12', label: 'Free Tests' },
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model('SubjectTestConfig', subjectTestConfigSchema);
