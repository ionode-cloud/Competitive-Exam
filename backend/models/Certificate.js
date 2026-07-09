const mongoose = require('mongoose');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : { v4: () => Math.random().toString(36).slice(2).toUpperCase() };

const CertificateSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mockTest:          { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' },
  course:            { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  score:             { type: Number, required: true },
  totalMarks:        { type: Number, required: true },
  percentage:        { type: Number, required: true },
  certificateNumber: { type: String, unique: true },
  issuedAt:          { type: Date, default: Date.now },
}, { timestamps: true });

CertificateSchema.pre('save', function(next) {
  if (!this.certificateNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.certificateNumber = `ES-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', CertificateSchema);
