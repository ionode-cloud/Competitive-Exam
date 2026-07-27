const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  questions: { type: Number, default: 0 },
  marks: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  negativeMarking: { type: Number, default: 0.25 },
}, { _id: false });

const subjectTestInstructionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTest', required: true, unique: true },
  title: { type: String, default: '' },
  summary: { type: String, default: '' },
  sections: [sectionSchema],
  instructions: [{ type: String }],
  agreementText: {
    type: String,
    default: 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.'
  },
}, { timestamps: true });

module.exports = mongoose.model('SubjectTestInstruction', subjectTestInstructionSchema);
