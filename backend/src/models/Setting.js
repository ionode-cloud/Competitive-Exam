const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  group: { type: String, default: 'general' }, // general, smtp, payment, storage, auth
  label: { type: String },
  type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], default: 'string' },
  isPublic: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
