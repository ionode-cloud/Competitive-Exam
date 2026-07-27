const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  included: { type: Boolean, default: true },
}, { _id: false });

const subscriptionPlanSchema = new mongoose.Schema({
  name:          { type: String, required: [true, 'Plan name is required'], trim: true },
  code:          { type: String, required: [true, 'Plan code is required'], unique: true, uppercase: true, trim: true },
  description:   { type: String, default: '' },
  type:          { type: String, enum: ['free', 'paid'], default: 'paid' },

  // Pricing
  price:         { type: Number, default: 0, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  currency:      { type: String, default: 'INR' },
  billingCycle:  {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'lifetime'],
    default: 'monthly',
  },

  // Validity
  duration:      { type: Number, default: 1, min: 1 },
  durationUnit:  { type: String, enum: ['days', 'months', 'years'], default: 'months' },

  // Features
  features: { type: [featureSchema], default: [] },

  // Visibility / Status
  isFeatured:    { type: Boolean, default: false },
  isVisible:     { type: Boolean, default: true },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },

  // Stats (denormalized counter — updated via hooks)
  subscriberCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// Auto-generate code from name if not provided
subscriptionPlanSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = this.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  }
  next();
});

// Computed validity in days
subscriptionPlanSchema.virtual('validityDays').get(function () {
  const unit = this.durationUnit;
  const d = this.duration;
  if (unit === 'days')   return d;
  if (unit === 'months') return d * 30;
  if (unit === 'years')  return d * 365;
  return d;
});

subscriptionPlanSchema.set('toJSON', { virtuals: true });
subscriptionPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
