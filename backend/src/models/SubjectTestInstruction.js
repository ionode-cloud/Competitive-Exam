const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  questions: { type: Number, default: 0 },
  marks: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  negativeMarking: { type: Number, default: 0.25 },
}, { _id: false });

const subjectTestInstructionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTest', default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  subjectName: { type: String, default: 'All Subjects', trim: true },
  topicName: { type: String, default: 'All Topics', trim: true },
  subTopic: { type: String, default: '', trim: true },
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', default: null },
  title: { type: String, required: true, default: 'General Examination Instructions', trim: true },
  summary: { type: String, default: '', trim: true },
  sections: [sectionSchema],
  instructions: [{ type: String, trim: true }],
  agreementText: {
    type: String,
    default: 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Ensure indices for rapid subject/topic instruction lookups
subjectTestInstructionSchema.index({ subjectId: 1, topicName: 1, subTopic: 1 });
subjectTestInstructionSchema.index({ subjectName: 1, topicName: 1 });
subjectTestInstructionSchema.index({ testId: 1 });

module.exports = mongoose.model('SubjectTestInstruction', subjectTestInstructionSchema);
