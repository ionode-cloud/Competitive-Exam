const mongoose = require('mongoose');

const PageContentSchema = new mongoose.Schema({
  page: { 
    type: String, 
    required: true, 
    unique: true 
  }, // 'home', 'about', 'courses', 'gallery', 'contact'
  content: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('PageContent', PageContentSchema);
