const mongoose = require('mongoose');

// A singleton document — there is only ever ONE EbookConfig in the DB
const ebookConfigSchema = new mongoose.Schema({
  /* ─── Hero Banner ──────────────────────────────────── */
  bannerEyebrow:  { type: String, default: 'PYQ Ebook' },
  bannerHeading:  { type: String, default: 'Previous Year Question E-Books' },
  bannerSubtitle: { type: String, default: 'Topic-wise PYQ collections — the most trusted exam resource for Odisha state exams.' },
  bannerStats: {
    type: [{ n: String, label: String }],
    default: [
      { n: '9+', label: 'E-Books' },
      { n: '2',  label: 'Free Titles' },
      { n: '7',  label: 'Subjects' },
    ],
  },

  /* ─── Navbar Dropdown Quick-Links ────────────────── */
  dropdownItems: {
    type: [{
      title:       { type: String, required: true },
      description: { type: String, default: '' },
      category:    { type: String, default: '' },
      order:       { type: Number, default: 0 },
    }],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('EbookConfig', ebookConfigSchema);
