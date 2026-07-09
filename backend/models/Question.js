const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // Existing fields (unchanged)
  text:          String,
  options:       [String],
  correctOption: Number,   // 0-indexed
  section:       String,
  marks:         { type: Number, default: 1 },
  exam:          { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  subjectName:   { type: String, default: '' },
  topicName:     { type: String, default: '' },

  // New fields (all optional for backward compatibility)
  explanation:   { type: String, default: '' },
  difficulty:    { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  topic:         { type: String, default: '' },
  language:      { type: String, default: 'English' },
  questionType:  {
    type: String,
    enum: ['single', 'multiple', 'truefalse', 'image', 'paragraph'],
    default: 'single'
  },
  negativeMarks: { type: Number, default: 0 },
  imageUrl:      { type: String, default: '' },
  correctOptions:[{ type: Number }],  // for multiple-choice type
});

module.exports = mongoose.model('Question', QuestionSchema);
