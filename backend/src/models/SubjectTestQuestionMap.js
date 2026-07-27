const mongoose = require('mongoose');

const subjectTestQuestionMapSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTest', required: true, index: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestQuestion', required: true, index: true },
  order: { type: Number, default: 0 },
  marksOverride: { type: Number, default: null }, // Null means use test/question default
  negativeMarksOverride: { type: Number, default: null },
}, { timestamps: true });

subjectTestQuestionMapSchema.index({ testId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('SubjectTestQuestionMap', subjectTestQuestionMapSchema);
