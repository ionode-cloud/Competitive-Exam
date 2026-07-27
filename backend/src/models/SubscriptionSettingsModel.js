const mongoose = require('mongoose');

const subscriptionSettingsSchema = new mongoose.Schema({
  // General
  enabled:                    { type: Boolean, default: true },
  allowFreePlan:              { type: Boolean, default: true },
  allowMultipleSubscriptions: { type: Boolean, default: false },
  allowUpgrade:               { type: Boolean, default: true },
  allowDowngrade:             { type: Boolean, default: true },
  allowCancellation:          { type: Boolean, default: true },

  // Renewal
  enableAutoRenewal:      { type: Boolean, default: false },
  renewalReminderDays:    { type: Number, default: 7 },
  expiryReminderDays:     { type: Number, default: 3 },

  // Payment
  currency:          { type: String, default: 'INR' },
  taxRate:           { type: Number, default: 0, min: 0, max: 100 }, // GST %
  paymentGateway:    { type: String, default: 'manual' }, // manual, razorpay, payu
  razorpayKeyId:     { type: String, default: '' },
  razorpayKeySecret:  { type: String, default: '' },
  refundPolicy:      { type: String, default: 'No refunds after 48 hours of purchase.' },
}, { timestamps: true });

// Singleton: get or create the one settings document
subscriptionSettingsSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('SubscriptionSettings', subscriptionSettingsSchema);
