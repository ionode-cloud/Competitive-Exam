const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plainPassword: { type: String },
  role: { type: String, enum: ['Admin', 'Root Admin'], default: 'Admin' }
});

module.exports = mongoose.model('Admin', AdminSchema);
