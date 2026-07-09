const mongoose = require('mongoose');

const ExamScheduleSchema = new mongoose.Schema({
  scheduleName:       { type: String, required: true },
  course:             { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  mockTest:           { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' },
  startDate:          { type: Date, required: true },
  endDate:            { type: Date, required: true },
  startTime:          { type: String, default: '00:00' },  // HH:MM
  endTime:            { type: String, default: '23:59' },
  timezone:           { type: String, default: 'Asia/Kolkata' },
  maxAttempts:        { type: Number, default: 1 },
  resultPublishDate:  { type: Date },
  mode:               { type: String, enum: ['practice', 'scheduled', 'live'], default: 'practice' },
  isActive:           { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ExamSchedule', ExamScheduleSchema);
