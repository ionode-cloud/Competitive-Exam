const mongoose = require('mongoose');

const subscriptionTransactionSchema = new mongoose.Schema({
  transactionId:   { type: String, unique: true, index: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subscriptionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'UserSubscription' },
  planId:          { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },

  amount:          { type: Number, required: true, min: 0 },
  currency:        { type: String, default: 'INR' },
  paymentMethod:   { type: String, default: '' },
  paymentGateway:  { type: String, default: '' },

  status: {
    type: String,
    enum: ['success', 'pending', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },

  paymentDate:    { type: Date },
  refundDate:     { type: Date },
  refundReason:   { type: String, default: '' },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  notes: { type: String, default: '' },
}, { timestamps: true });

subscriptionTransactionSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transactionId = `TXN-${date}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('SubscriptionTransaction', subscriptionTransactionSchema);
