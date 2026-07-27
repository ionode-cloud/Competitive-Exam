const mongoose = require('mongoose');

// A singleton document — there is only ever ONE MaterialsConfig in the DB
const materialsConfigSchema = new mongoose.Schema({
  /* ─── Hero Banner ──────────────────────────────────── */
  bannerEyebrow: { type: String, default: 'Study Materials' },
  bannerHeading: { type: String, default: 'Free & Premium Study Materials' },
  bannerSubtitle: { type: String, default: 'Read Current Affairs, Odisha GK, Static GK, English, Computer & more PDFs — curated for Odisha state exams.' },
  bannerStats: {
    type: [{ n: String, label: String }],
    default: [
      { n: '50+',   label: 'Materials'   },
      { n: 'Daily', label: 'CA Updates'  },
      { n: '2L+',   label: 'Downloads'   },
    ],
  },

  /* ─── Hero Dropdown Quick-Links ────────────────────── */
  dropdownItems: {
    type: [{
      title:       { type: String, required: true },
      description: { type: String, default: '' },
      category:    { type: String, default: '' },  // links to a category filter tab
      order:       { type: Number, default: 0 },
    }],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('MaterialsConfig', materialsConfigSchema);
