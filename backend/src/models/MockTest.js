const mongoose = require('mongoose');

const questionItemSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  order: { type: Number, default: 0 },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0.25 },
  section: { type: String, default: 'General' },
});

const mockTestSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Mock test name is required'], trim: true },
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  subjectName: { type: String },
  topicName: { type: String },
  subTopic: { type: String, trim: true },
  examPaper: { type: String, trim: true }, // RI, ARI, AMIN, PEO
  testType: {
    type: String,
    enum: ['full_length', 'sectional', 'chapter_wise', 'previous_year'],
    default: 'full_length',
  },
  sections: [{ type: String }], // e.g. Reasoning, Math, English, GK
  questions: [questionItemSchema],
  totalQuestions: { type: Number, required: true, default: 100 },
  completedQuestions: { type: Number, default: 0 },
  duration: { type: Number, required: true, default: 60 }, // minutes
  totalMarks: { type: Number, default: 100 },
  safeScore: { type: Number, default: 0 },
  negativeMarking: { type: Number, default: 0.25 },
  pricingType: { type: String, enum: ['free', 'paid'], default: 'free' },
  price: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'deactivated', 'active', 'coming_soon', 'disabled'],
    default: 'published',
  },
  publishAt: { type: Date },
  examStartTime: { type: Date },
  examEndTime: { type: Date },
  // Options
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  showResultImmediately: { type: Boolean, default: true },
  enableReview: { type: Boolean, default: true },
  allowResume: { type: Boolean, default: false },
  enableCalculator: { type: Boolean, default: false },
  // Stats
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  // Meta
  instructions: { type: String },
  thumbnail: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },
  isDuplicate: { type: Boolean, default: false },
  originalMockTest: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' },
}, { timestamps: true });

// Auto-generate name/title fallback
mockTestSchema.pre('validate', function () {
  if (!this.name || !this.name.trim()) {
    this.name = this.subTopic || this.topicName || (this.subjectName ? `${this.subjectName} Mock Test` : 'Mock Test');
  }
});

// Auto-update completedQuestions count
mockTestSchema.methods.updateCompletedCount = function () {
  this.completedQuestions = this.questions.length;
  return this.save();
};

module.exports = mongoose.model('MockTest', mockTestSchema);
