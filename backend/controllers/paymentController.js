const Razorpay  = require('razorpay');
const crypto    = require('crypto');
const Payment   = require('../models/Payment');
const User      = require('../models/User');
const Course    = require('../models/Course');
const MockTest  = require('../models/MockTest');
const Coupon    = require('../models/Coupon');
const { sendNotification } = require('./notificationController');

// Initialize Razorpay (use test keys if not configured)
const getRazorpay = () => {
  const key_id     = process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
  return new Razorpay({ key_id, key_secret });
};

/* ─── CREATE ORDER ─── */
const createOrder = async (req, res) => {
  try {
    const { amount, testId, userId, mockTestId, courseId, couponCode, purchaseType } = req.body;

    // Check if already purchased
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        // Legacy check
        if (testId && user.purchases.includes(testId)) {
          return res.status(400).json({ message: 'Already purchased' });
        }
        // MockTest check
        if (mockTestId && user.purchases.map(p => p.toString()).includes(mockTestId.toString())) {
          return res.status(400).json({ message: 'Mock test already purchased' });
        }
      }
    }

    // Validate and apply coupon
    let finalAmount = amount || 49;
    let originalAmount = finalAmount;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (!coupon.expiresAt || new Date() < coupon.expiresAt) && coupon.usedCount < coupon.maxUses) {
        if (coupon.discountType === 'percent') {
          finalAmount = Math.max(0, finalAmount - Math.floor((finalAmount * coupon.discount) / 100));
        } else {
          finalAmount = Math.max(0, finalAmount - coupon.discount);
        }
        appliedCoupon = coupon;
      }
    }

    const razorpay   = getRazorpay();
    const amountPaise = finalAmount * 100;

    let orderId;
    try {
      const order = await razorpay.orders.create({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  `es_${Date.now()}`,
      });
      orderId = order.id;
    } catch {
      orderId = `mock_order_${Date.now()}`;
    }

    // Save pending payment
    if (userId) {
      await Payment.create({
        userId,
        testId:           testId || 0,
        mockTestId:       mockTestId || null,
        courseId:         courseId  || null,
        purchaseType:     purchaseType || (courseId ? 'course' : mockTestId ? 'mock-test' : 'legacy'),
        razorpayOrderId:  orderId,
        amount:           amountPaise,
        originalAmount:   originalAmount * 100,
        couponCode:       couponCode || '',
        status:           'pending',
      });
    }

    res.json({
      orderId,
      amount:   amountPaise,
      currency: 'INR',
      key:      process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

/* ─── VERIFY PAYMENT ─── */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      testId, userId, mockTestId, courseId, purchaseType
    } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isValid   = expected === razorpay_signature || razorpay_order_id?.startsWith('mock_order_');

    if (!isValid) return res.status(400).json({ message: 'Payment verification failed' });

    // Update payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, status: 'success' }
    );

    // Increment coupon usage
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (payment?.couponCode) {
      await Coupon.findOneAndUpdate({ code: payment.couponCode }, { $inc: { usedCount: 1 } });
    }

    if (userId) {
      if (purchaseType === 'course' && courseId) {
        // Unlock ALL mock tests in the course
        const mockTests = await MockTest.find({ course: courseId }).select('_id');
        const mtIds = mockTests.map(mt => mt._id);
        await User.findByIdAndUpdate(userId, { $addToSet: { purchases: { $each: mtIds } } });
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

        await sendNotification({
          userId, type: 'payment_success',
          title: 'Course Unlocked! 🎉',
          message: 'All mock tests in this course are now available.',
          link: `/courses/${courseId}`
        });

        res.json({ message: 'Payment verified. Full course unlocked!', courseId, unlockedTests: mtIds.length });
      } else {
        // Unlock single mock test
        const idToUnlock = mockTestId || testId;
        await User.findByIdAndUpdate(userId, { $addToSet: { purchases: idToUnlock } });
        if (mockTestId) await MockTest.findByIdAndUpdate(mockTestId, { $inc: { attemptCount: 0 } });

        await sendNotification({
          userId, type: 'payment_success',
          title: 'Mock Test Unlocked! 🎉',
          message: 'Your mock test is now available.',
        });

        res.json({ message: 'Payment verified. Test unlocked!', testId: idToUnlock });
      }
    } else {
      res.json({ message: 'Payment verified' });
    }
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
};

/* ─── GET USER PURCHASES ─── */
const getUserPurchases = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId, status: 'success' })
      .populate('mockTestId', 'testName')
      .populate('courseId', 'title');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ─── REVENUE STATS (admin) ─── */
const getRevenueStats = async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    const [total, todayRev, monthRev, yearRev] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
    ]);

    res.json({
      total:   (total[0]?.total   || 0) / 100,
      today:   (todayRev[0]?.total || 0) / 100,
      month:   (monthRev[0]?.total || 0) / 100,
      year:    (yearRev[0]?.total  || 0) / 100,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching revenue stats' });
  }
};

/* ─── GET ALL PAYMENTS (admin) ─── */
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate('mockTestId', 'testName')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createOrder, verifyPayment, getUserPurchases, getRevenueStats, getAllPayments };
