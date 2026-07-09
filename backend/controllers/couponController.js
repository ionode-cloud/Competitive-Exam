const Coupon = require('../models/Coupon');

/* ─── VALIDATE COUPON ─── */
const validateCoupon = async (req, res) => {
  try {
    const { code, amount, courseId, mockTestId } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ message: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    if (amount < coupon.minAmount)
      return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minAmount}` });

    // Check applicability
    if (courseId && coupon.applicableCourses.length > 0) {
      const applicable = coupon.applicableCourses.map(id => id.toString());
      if (!applicable.includes(courseId.toString()))
        return res.status(400).json({ message: 'Coupon not applicable to this course' });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = Math.floor((amount * coupon.discount) / 100);
    } else {
      discountAmount = Math.min(coupon.discount, amount);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount),
      discountType: coupon.discountType,
      discount: coupon.discount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error validating coupon' });
  }
};

/* ─── GET ALL COUPONS (admin) ─── */
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching coupons' });
  }
};

/* ─── CREATE COUPON (admin) ─── */
const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon({ ...req.body, code: req.body.code?.toUpperCase() });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Coupon code already exists' });
    res.status(500).json({ message: 'Error creating coupon' });
  }
};

/* ─── UPDATE COUPON (admin) ─── */
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Error updating coupon' });
  }
};

/* ─── DELETE COUPON (admin) ─── */
const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting coupon' });
  }
};

module.exports = { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon };
