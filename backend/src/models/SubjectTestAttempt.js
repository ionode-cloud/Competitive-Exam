const mongoose = require('mongoose');

const subjectTestAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTest', required: true, index: true },
  startTime: { type: Date, required: true, default: Date.now },
  expiryTime: { type: Date, required: true },
  endTime: { type: Date },
  durationMins: { type: Number, default: 25 },
  selectedLanguage: { type: String, default: 'en' },
  status: { type: String, enum: ['in_progress', 'completed', 'expired'], default: 'in_progress' },
  currentQuestionIndex: { type: Number, default: 0 },
  answers: { type: Map, of: String, default: {} }, // questionId -> selectedOption ('A', 'B', etc)
  questionStates: { type: Map, of: String, default: {} }, // questionId -> 'NOT_VISITED'|'NOT_ANSWERED'|'ANSWERED'|'MARKED'|'ANSWERED_MARKED'
  questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestQuestion' }],
  isPreview: { type: Boolean, default: false },
  
  // Results (populated after submission)
  score: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  positiveMarksTotal: { type: Number, default: 0 },
  negativeMarksTotal: { type: Number, default: 0 },
  timeTakenSec: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('SubjectTestAttempt', subjectTestAttemptSchema);
