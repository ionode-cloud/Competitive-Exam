const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  correctOption: Number, // 0, 1, 2, 3
  section: String,
  marks: { type: Number, default: 1 },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  subjectName: { type: String, default: '' },  // for bank-only questions
  topicName:   { type: String, default: '' },  // for bank-only questions
});

module.exports = mongoose.model('Question', QuestionSchema);
