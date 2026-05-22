const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plainPassword: { type: String }
});

module.exports = mongoose.model('Admin', AdminSchema);
