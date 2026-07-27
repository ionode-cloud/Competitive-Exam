const mongoose = require('mongoose');

const subjectTestTopicSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestSubject', required: true },
  name: { type: String, required: [true, 'Topic name is required'], trim: true },
  code: { type: String, trim: true },
  description: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SubjectTestTopic', subjectTestTopicSchema);
