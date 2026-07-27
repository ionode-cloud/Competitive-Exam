const mongoose = require('mongoose');

const subjectTestCategoryPurchaseSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectTestSubject', required: true, index: true },
  amount:     { type: Number, required: true },
  paymentId:  { type: String, default: '' },   // Razorpay payment ID or 'manual'
  orderId:    { type: String, default: '' },
  purchasedAt:{ type: Date, default: Date.now },
}, { timestamps: true });

subjectTestCategoryPurchaseSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('SubjectTestCategoryPurchase', subjectTestCategoryPurchaseSchema);
