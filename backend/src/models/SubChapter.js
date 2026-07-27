const mongoose = require('mongoose');

const subChapterSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Sub-chapter name is required'], trim: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
  questionCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

subChapterSchema.index({ chapter: 1, subject: 1, order: 1 });

module.exports = mongoose.model('SubChapter', subChapterSchema);
