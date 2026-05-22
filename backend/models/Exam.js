const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  subjectName: String,
  topicName: String,
  negativeMarking: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  duration: Number, // in minutes
  sections: [String],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  isActive: { type: Boolean, default: true },
  languages: { type: [String], default: ['English', 'Hindi', 'Odia'] },
  instructions: { type: mongoose.Schema.Types.Mixed, default: { English: '', Hindi: '', Odia: '' } },
  customSections: [{
    name: String,
    questions: Number,
    marks: Number,
    duration: Number
  }]
});

module.exports = mongoose.model('Exam', ExamSchema);
