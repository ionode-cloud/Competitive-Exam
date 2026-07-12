const mongoose = require('mongoose');

const QuestionBookSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  subject:      { type: String, required: true },
  pdfData:      { type: String, required: true }, // Store base64-encoded PDF data
  price:        { type: Number, default: 0 },     // Price in INR
  offerPrice:   { type: Number, default: 0 },     // Offer Price in INR
  isFree:       { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('QuestionBook', QuestionBookSchema);
