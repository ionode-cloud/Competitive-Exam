const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  event:       { type: String, required: true },
  description: { type: String, default: '' },
  by:          { type: String, default: 'system' }, // 'admin', 'system', 'user'
  date:        { type: Date, default: Date.now },
}, { _id: false });

const userSubscriptionSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planId:         { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  subscriptionId: { type: String, unique: true, index: true }, // e.g. SUB-20240725-ABCD

  // Dates
  startDate:  { type: Date, required: true },
  expiryDate: { type: Date, required: true },

  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending', 'suspended'],
    default: 'pending',
    index: true,
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'pending',
  },
  amount:        { type: Number, default: 0 },
  currency:      { type: String, default: 'INR' },
  transactionId: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },

  // Settings
  autoRenew: { type: Boolean, default: false },

  // Admin notes
  notes: { type: String, default: '' },

  // Audit trail
  timeline: { type: [timelineEventSchema], default: [] },

  // Extension history
  extensions: [{
    extendedBy:  { type: Number }, // days
    reason:      { type: String },
    newExpiry:   { type: Date },
    extendedAt:  { type: Date, default: Date.now },
    extendedBy_: { type: String, default: 'admin' },
  }],
}, { timestamps: true });

// Auto-generate subscriptionId before save
userSubscriptionSchema.pre('save', async function (next) {
  if (!this.subscriptionId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.subscriptionId = `SUB-${date}-${rand}`;
  }
  next();
});

// Virtual: remaining days
userSubscriptionSchema.virtual('remainingDays').get(function () {
  if (!this.expiryDate) return 0;
  const diff = new Date(this.expiryDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

userSubscriptionSchema.set('toJSON', { virtuals: true });
userSubscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
