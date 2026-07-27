const mongoose = require('mongoose');

const materialCategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Category title is required'],
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  icon: {
    type: String,
    default: 'book',
  },
  link: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#1957D6',
  },
  bg: {
    type: String,
    default: '#EAF1FD',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Pre-save to sync name and title
materialCategorySchema.pre('save', function (next) {
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;
  next();
});

module.exports = mongoose.model('MaterialCategory', materialCategorySchema);
