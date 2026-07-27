const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Book title is required'], trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  category: { type: String, default: 'Other' },
  description: { type: String },
  thumbnail: { type: String },
  pdfUrl: { type: String, required: [true, 'PDF file is required'] },
  pdfPublicId: { type: String }, // Cloudinary public_id
  fileSize: { type: Number }, // bytes
  pages: { type: String, default: '150+ pages' },
  year: { type: String, default: '2018-2025' },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  downloadCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  instructions: [{ type: String }],
  language: { type: String, default: 'en' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EBook', ebookSchema);
