const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Chapter name is required'], trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
  questionCount: { type: Number, default: 0 },
  subChapterCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

chapterSchema.index({ subject: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
