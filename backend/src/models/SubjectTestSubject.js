const mongoose = require('mongoose');

const subjectTestSubjectSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Subject name is required'], trim: true },
  code: { type: String, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'calculator' },
  color: { type: String, default: '#1957D6' },
  bg: { type: String, default: '#EAF1FD' },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  showInPyqEbook: { type: Boolean, default: true },
  topics: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SubjectTestSubject', subjectTestSubjectSchema);
