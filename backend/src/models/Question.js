const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  label: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  text: { type: String, required: true }, // supports HTML from rich text
  image: { type: String },
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: [true, 'Question text is required'] }, // HTML rich text
  questionImage: { type: String },
  options: {
    type: [optionSchema],
    validate: {
      validator: (v) => v.length === 4,
      message: 'Question must have exactly 4 options',
    },
  },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  explanation: { type: String }, // HTML rich text
  explanationImage: { type: String },
  // Hierarchy
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  topic: { type: String },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  subChapter: { type: mongoose.Schema.Types.ObjectId, ref: 'SubChapter' },
  // Meta
  difficulty: { type: String, enum: ['easy', 'moderate', 'difficult'], default: 'moderate' },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0.25 },
  section: { type: String, default: 'General' },
  tags: [{ type: String }],
  // Status
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  isInQuestionBank: { type: Boolean, default: true },
  // Usage tracking
  usedInTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' }],
  attemptCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  // Creator
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDuplicate: { type: Boolean, default: false },
  originalQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  // Source
  source: { type: String, enum: ['manual', 'import', 'bank'], default: 'manual' },
  importBatch: { type: String },
  // Language support
  language: { type: String, default: 'en' },
}, { timestamps: true });

// Indexes for efficient filtering
questionSchema.index({ subject: 1, chapter: 1, subChapter: 1 });
questionSchema.index({ difficulty: 1, status: 1 });
questionSchema.index({ isInQuestionBank: 1 });

module.exports = mongoose.model('Question', questionSchema);
