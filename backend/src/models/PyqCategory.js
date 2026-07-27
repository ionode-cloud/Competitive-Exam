const mongoose = require('mongoose');

const pyqCategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Category title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  icon: {
    type: String,
    default: 'book', // e.g. 'computer', 'book', 'font', 'calculator', 'globe', 'flask', 'puzzle', 'file'
  },
  link: {
    type: String,
    default: '',
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

module.exports = mongoose.model('PyqCategory', pyqCategorySchema);
