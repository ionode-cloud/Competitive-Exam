const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // e.g. 'A', 'B', 'C', 'D'
  text: { type: String, required: true },
  image: { type: String, default: '' },
}, { _id: false });

const subjectTestQuestionSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestSubject', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestTopic', required: true },
  questionType: { type: String, enum: ['single_correct', 'multiple_correct', 'true_false'], default: 'single_correct' },
  questionText: { type: String, required: [true, 'Question text is required'] },
  questionImage: { type: String, default: '' },
  options: [optionSchema],
  correctAnswer: { type: String, required: [true, 'Correct answer option ID is required'] },
  defaultMarks: { type: Number, default: 1 },
  defaultNegativeMarks: { type: Number, default: 0.25 },
  safeScore: { type: Number, default: 0 },
  explanation: { type: String, default: '' },
  explanationImage: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  language: { type: String, default: 'en' }, // 'en', 'or', 'hi'
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SubjectTestQuestion', subjectTestQuestionSchema);
