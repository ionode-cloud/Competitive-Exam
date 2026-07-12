const mongoose = require('mongoose');

const QuestionBookSubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  showOnHome: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('QuestionBookSubject', QuestionBookSubjectSchema);
