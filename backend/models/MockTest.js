const mongoose = require('mongoose');

const MockTestSchema = new mongoose.Schema({
  course:         { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  exam:           { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, // links to existing exam engine
  testName:       { type: String, required: true, trim: true },
  testNumber:     { type: Number, default: 1 },
  totalQuestions: { type: Number, default: 0 },
  totalMarks:     { type: Number, default: 0 },
  passingMarks:   { type: Number, default: 0 },
  negativeMarking:{ type: Number, default: 0 },
  duration:       { type: Number, default: 60 },   // minutes
  language:       { type: [String], default: ['English'] },
  isFree:         { type: Boolean, default: false },
  price:          { type: Number, default: 49 },   // in INR
  isActive:       { type: Boolean, default: true },
  attemptCount:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('MockTest', MockTestSchema);
