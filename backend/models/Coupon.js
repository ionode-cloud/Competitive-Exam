const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code:                 { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount:             { type: Number, required: true },                    // amount or percent
  discountType:         { type: String, enum: ['percent', 'flat'], default: 'percent' },
  maxUses:              { type: Number, default: 100 },
  usedCount:            { type: Number, default: 0 },
  expiresAt:            { type: Date },
  applicableCourses:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],   // empty = all
  applicableMockTests:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' }], // empty = all
  minAmount:            { type: Number, default: 0 },
  isActive:             { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);
