const mongoose = require('mongoose');

const odishaExamSchema = new mongoose.Schema({
  examinationName: {
    type: String,
    required: [true, 'Examination Name is required'],
    trim: true,
  },
  mockTestName: {
    type: String,
    required: [true, 'Mock Test Name is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('OdishaExam', odishaExamSchema);
