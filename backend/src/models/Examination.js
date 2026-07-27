const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Examination name is required'],
    unique: true,
    trim: true,
  },
  slug: { type: String, unique: true },
  description: { type: String },
  icon: { type: String },
  mockTestsCount: { type: Number, default: 0 },
  price: { type: Number, default: 0, min: 0 },
  isFree: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }],
}, { timestamps: true });

// Auto-generate slug
examinationSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Examination', examinationSchema);
