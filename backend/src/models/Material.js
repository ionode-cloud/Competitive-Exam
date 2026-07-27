const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Title is required'], trim: true },
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  category:    { type: String, default: 'Other' },
  description: { type: String },
  thumbnail:   { type: String },
  pdfUrl:      { type: String, required: [true, 'PDF file is required'] },
  pdfPublicId: { type: String },
  fileSize:    { type: Number },  // bytes
  price:       { type: Number, default: 0 },
  isFree:      { type: Boolean, default: true },
  status:      { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  downloadCount: { type: Number, default: 0 },
  tags:        [{ type: String }],
  instructions:[{ type: String }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
