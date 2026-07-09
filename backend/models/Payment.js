const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  // Existing fields (backward compatible)
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId:             { type: mongoose.Schema.Types.Mixed },          // legacy number OR ObjectId
  razorpayOrderId:    { type: String },
  razorpayPaymentId:  { type: String },
  amount:             { type: Number, required: true },               // in paise
  status:             { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },

  // New fields
  mockTestId:         { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' },
  courseId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  purchaseType:       { type: String, enum: ['mock-test', 'course', 'legacy'], default: 'legacy' },
  couponCode:         { type: String, default: '' },
  originalAmount:     { type: Number, default: 0 },                  // before discount (paise)
  createdAt:          { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);
