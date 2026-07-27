const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  plainPassword: { type: String, default: '' },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'],
    default: 'student',
  },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  purchasedMockTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' }],
  refreshToken: { type: String, select: false },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user is admin
userSchema.methods.isAdmin = function () {
  return ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'].includes(this.role);
};

module.exports = mongoose.model('User', userSchema);
