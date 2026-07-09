const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true },
  description:    { type: String, default: '' },
  thumbnail:      { type: String, default: '' },   // base64 or URL
  banner:         { type: String, default: '' },
  category:       { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  categoryName:   { type: String, default: '' },   // denormalised for speed
  difficulty:     { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  duration:       { type: String, default: '' },   // e.g. "60 min"
  totalQuestions: { type: Number, default: 0 },
  totalMockTests: { type: Number, default: 0 },
  languages:      { type: [String], default: ['English'] },
  price:          { type: Number, default: 0 },    // in INR
  offerPrice:     { type: Number, default: 0 },
  discount:       { type: Number, default: 0 },    // percent
  offerExpiry:    { type: Date },
  freeTestsCount: { type: Number, default: 2 },    // first N tests are free
  rating:         { type: Number, default: 4.5 },
  enrolledCount:  { type: Number, default: 0 },
  tags:           { type: [String], default: [] },
  isActive:       { type: Boolean, default: true },
  videoUrl:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
