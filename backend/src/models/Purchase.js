const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productType: { type: String, enum: ['mocktest', 'subject', 'ebook', 'bundle'], required: true },
  product: { type: mongoose.Schema.Types.ObjectId, refPath: 'productModel' },
  productModel: { type: String, enum: ['MockTest', 'Subject', 'EBook'] },
  productName: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'], default: 'pending' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  couponCode: { type: String },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number },
  invoiceUrl: { type: String },
  notes: { type: String },
}, { timestamps: true });

purchaseSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  if (!this.finalAmount) {
    this.finalAmount = this.amount - (this.discount || 0);
  }
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
