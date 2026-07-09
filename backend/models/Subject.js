const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  syllabusPoints: { type: [String], default: [] },
  preparationStrategy: { type: String, default: '' },
  applicableExams: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
