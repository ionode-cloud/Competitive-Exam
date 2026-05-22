const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: String,
  rollNumber: { type: String, required: true, unique: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
});

module.exports = mongoose.model('Student', StudentSchema);
