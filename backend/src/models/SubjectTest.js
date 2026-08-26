const mongoose = require('mongoose');

const subjectTestSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestSubject' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  topicName: { type: String, trim: true },
  subTopic: { type: String, trim: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestTopic' },
  title: { type: String, trim: true, default: '' },
  startTime: { type: Date },
  startExamTime: { type: Date },
  code: { type: String, trim: true },
  description: { type: String, default: '' },
  testType: { type: String, enum: ['practice', 'topic', 'subject'], default: 'practice' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Medium' },
  accessType: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
  price: { type: Number, default: 49 },
  totalQuestions: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  safeScore: { type: Number, default: 0 },
  duration: { type: Number, default: 25 }, // in minutes
  positiveMarks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0.25 },
  defaultLanguage: { type: String, default: 'en' },
  availableLanguages: [{ type: String, default: ['en'] }],
  allowLanguageChange: { type: Boolean, default: true },
  allowNavigation: { type: Boolean, default: true },
  allowMarkForReview: { type: Boolean, default: true },
  allowClearResponse: { type: Boolean, default: true },
  resultSettings: {
    showResultImmediately: { type: Boolean, default: true },
    showSolutions: { type: Boolean, default: true },
    showExplanation: { type: Boolean, default: true },
    showRank: { type: Boolean, default: true },
    showPercentage: { type: Boolean, default: true },
    showAnalysis: { type: Boolean, default: true },
  },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  randomizeQuestions: { type: Boolean, default: false },
  randomizeOptions: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

subjectTestSchema.pre('validate', function() {
  if (!this.title || !this.title.trim()) {
    this.title = this.subTopic || this.topicName || 'Subject Practice Test';
  }
});

module.exports = mongoose.model('SubjectTest', subjectTestSchema);
