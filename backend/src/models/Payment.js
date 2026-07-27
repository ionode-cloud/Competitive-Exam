const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  razorpaySignature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'refunded'], default: 'created' },
  method: { type: String }, // card, netbanking, upi, wallet
  bank: { type: String },
  wallet: { type: String },
  vpa: { type: String }, // UPI VPA
  email: { type: String },
  contact: { type: String },
  errorCode: { type: String },
  errorDescription: { type: String },
  refundId: { type: String },
  refundAmount: { type: Number },
  refundStatus: { type: String },
  notes: { type: Object },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
