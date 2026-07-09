const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  phone:      { type: String, default: '' },
  avatar:     { type: String, default: '' }, // base64 or URL
  isVerified: { type: Boolean, default: false },
  otp:        { type: String },
  otpExpiry:  { type: Date },
  purchases:  { type: [mongoose.Schema.Types.Mixed], default: [] },
  joinedAt:   { type: Date, default: Date.now },
  lastSeen:   { type: Date, default: Date.now },
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
