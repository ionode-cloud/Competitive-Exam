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
  // Home page auto-scroll banner slides (managed from Admin Panel)
  homeBannerSlides: {
    type: [{
      tag:     { type: String, default: '' },
      title:   { type: String, default: '' },
      desc:    { type: String, default: '' },
      price:   { type: String, default: '' },
      orig:    { type: String, default: '' },
      cta:     { type: String, default: 'Get Admission' },
      bgColor: { type: String, default: '' },   // CSS gradient or hex color for slide bg
      bgImage: { type: String, default: '' },   // URL of uploaded banner illustration image
    }],
    default: [
      { tag: 'MAINS QUANT BATCH', title: 'Saviour 4.0 — One Stop Solution', desc: '50+ live mains-level quant classes, topic-wise sessions, sectional tests + quizzes.', price: '₹499', orig: '₹1,999', cta: 'Grab It Now' },
      { tag: 'OPSC OAS BATCH', title: 'Mission OAS 2026 — Comprehensive', desc: 'Integrated Prelims + Mains syllabus coverage with senior civil servant mentors.', price: '₹2,499', orig: '₹9,999', cta: 'Enrol Now' },
      { tag: 'OSSSC RI / ARI', title: 'Revenue Inspector Special Batch', desc: 'Complete syllabus of Mathematics, Computer, Odia, English and General Knowledge.', price: '₹999', orig: '₹3,999', cta: 'Join Batch' },
      { tag: 'OSSC CGL BATCH', title: 'CGL Target Batch 2026', desc: 'Topic wise video classes, daily quizzes, full-length test series and doubt clearing.', price: '₹1,199', orig: '₹4,999', cta: 'Get Admission' },
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model('OdishaExamConfig', odishaExamConfigSchema);
