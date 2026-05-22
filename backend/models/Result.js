const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: Number,
    isCorrect: Boolean,
    status: { type: String, enum: ['answered', 'marked', 'not-answered', 'not-visited'] }
  }],
  score: Number,
  timeTaken: Number,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);
