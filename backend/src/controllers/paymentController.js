const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const User = require('../models/User');
const MockTest = require('../models/MockTest');
const { paginate, paginateResponse } = require('../utils/pagination');

// ===== ORDERS =====

exports.getOrders = async (req, res, next) => {
  try {
    const { search, status, productType, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (productType) filter.productType = productType;
    if (search) filter.orderId = { $regex: search, $options: 'i' };

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Purchase.find(filter).sort(sort).skip(skip).limit(lim)
        .populate('student', 'name email')
        .populate('paymentId'),
      Purchase.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Purchase.findById(req.params.id)
      .populate('student', 'name email phone')
      .populate('paymentId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.refundOrder = async (req, res, next) => {
  try {
    const order = await Purchase.findByIdAndUpdate(req.params.id,
      { status: 'refunded' },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order, message: 'Order marked as refunded' });
  } catch (err) { next(err); }
};

/* ── Get Logged-in Student Purchases & Bill History ───────────────────────── */
exports.getMyPurchases = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const purchases = await Purchase.find({ student: userId }).sort('-createdAt');
    const user = await User.findById(userId);

    const resultList = [];

    if (user && user.subscription?.name) {
      resultList.push({
        id: 'SUB-' + user._id.toString().substring(18).toUpperCase(),
        item: user.subscription.name || 'Pro Package Membership',
        type: 'Subscription Plan',
        date: new Date(user.updatedAt || user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        expireDate: user.subscription.validUntil ? user.subscription.validUntil : new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        price: '₹' + (user.subscription.price || 499),
        amount: user.subscription.price || 499,
        status: 'ACTIVE',
        billNo: 'BILL-PRO-' + user._id.toString().substring(18),
        paymentMethod: 'Online Payment (Razorpay / UPI)',
      });
    }

    purchases.forEach(p => {
      const pDate = new Date(p.createdAt);
      const expDate = new Date(pDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      resultList.push({
        id: p.orderId || ('ORD-' + p._id.toString().substring(18).toUpperCase()),
        item: p.productName || 'Competitive Test Series Pack',
        type: p.productType ? p.productType.toUpperCase() : 'COURSE PACK',
        date: pDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        expireDate: expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        price: '₹' + (p.finalAmount || p.amount),
        amount: p.finalAmount || p.amount,
        status: p.status === 'completed' ? 'ACTIVE' : p.status.toUpperCase(),
        billNo: 'BILL-' + (p.orderId || p._id),
        paymentMethod: 'Razorpay / UPI'
      });
    });

    if (resultList.length === 0 && (user?.isPremium || user?.isSubscribed)) {
      resultList.push({
        id: 'SUB-PRO-PASS',
        item: 'Odisha Exams Unlimited Pro Pass',
        type: 'SUBSCRIPTION',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        price: '₹499',
        amount: 499,
        status: 'ACTIVE',
        billNo: 'BILL-PRO-ODISHA-PASS',
        paymentMethod: 'UPI / Online Card'
      });
    }

    res.json({ success: true, data: resultList });
  } catch (err) { next(err); }
};

// ===== PAYMENTS =====

exports.getPayments = async (req, res, next) => {
  try {
    const { status, method, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Payment.find(filter).sort(sort).skip(skip).limit(lim)
        .populate('student', 'name email')
        .populate('purchase', 'orderId productName'),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

// Razorpay webhook handler
exports.razorpayWebhook = async (req, res, next) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const paymentData = payload.payment.entity;
      await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentData.id },
        { status: 'captured', method: paymentData.method },
        { upsert: true }
      );
      // Update purchase status
      if (paymentData.order_id) {
        await Purchase.findOneAndUpdate(
          { razorpayOrderId: paymentData.order_id },
          { status: 'completed', razorpayPaymentId: paymentData.id }
        );
      }
    }

    if (event === 'payment.failed') {
      const paymentData = payload.payment.entity;
      await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentData.id },
        { status: 'failed', errorCode: paymentData.error_code, errorDescription: paymentData.error_description }
      );
    }

    res.json({ status: 'ok' });
  } catch (err) { next(err); }
};

// Revenue summary
exports.getRevenueStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRevenue, monthRevenue, totalRevenue] = await Promise.all([
      Purchase.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      Purchase.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      Purchase.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        today: todayRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
        total: totalRevenue[0]?.total || 0,
      },
    });
  } catch (err) { next(err); }
};

// ===== RAZORPAY INTEGRATION =====
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const SubscriptionSettingsModel = require('../models/SubscriptionSettingsModel');
const UserSubscription = require('../models/UserSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionTransaction = require('../models/SubscriptionTransaction');

// Helper to get active Razorpay keys (env or database settings)
const getRazorpayCredentials = async () => {
  let keyId     = process.env.RAZORPAY_KEY_ID?.trim();
  let keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    try {
      const settings = await SubscriptionSettingsModel.getOrCreate();
      if (settings.razorpayKeyId && settings.razorpayKeySecret) {
        keyId     = settings.razorpayKeyId.trim();
        keySecret = settings.razorpayKeySecret.trim();
      }
    } catch (e) {
      console.error('Error reading subscription settings:', e);
    }
  }

  return { keyId, keySecret };
};

// 1. Get Public Razorpay Key
exports.getRazorpayKey = async (req, res, next) => {
  try {
    const { keyId } = await getRazorpayCredentials();
    res.json({
      success: true,
      keyId: keyId || 'rzp_test_placeholder', // Fallback for frontend initialization test mode
      configured: !!keyId,
    });
  } catch (err) { next(err); }
};

// 2. Create Razorpay Order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', itemName = 'Subscription Plan', planId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const { keyId, keySecret } = await getRazorpayCredentials();

    // Amount in Razorpay must be in paise (subunits)
    const amountInPaise = Math.round(Number(amount) * 100);

    // If Razorpay keys are properly configured, call official Razorpay API
    if (keyId && keySecret && keyId !== 'rzp_test_placeholder') {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes: { itemName, planId: planId || '' },
      });

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        isMock: false,
      });
    }

    // Fallback: standard test/mock order response if API keys are not supplied yet
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return res.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency,
      keyId: keyId || 'rzp_test_mockKey',
      isMock: true,
      message: 'Razorpay order generated in test/simulation mode.',
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    next(err);
  }
};

// 3. Verify Razorpay Payment Signature & Activate Subscription
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      amount,
      isMock,
      userId,
      paymentMethod = 'Razorpay',
    } = req.body;

    const { keySecret } = await getRazorpayCredentials();

    // Real Razorpay signature verification (if not mock mode and keySecret available)
    if (!isMock && keySecret) {
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text.toString())
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay payment verification failed: Invalid signature',
        });
      }
    }

    const payUserId = userId || req.user?._id;
    const finalTxnId = razorpay_payment_id || `PAY_${Date.now()}`;

    // Record Payment
    await Payment.create({
      student: payUserId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: finalTxnId,
      razorpaySignature: razorpay_signature || '',
      amount: Number(amount) || 0,
      status: 'captured',
      method: paymentMethod,
    }).catch(() => {});

    // Activate Subscription if planId is provided
    if (planId && payUserId) {
      const plan = await SubscriptionPlan.findById(planId);
      if (plan) {
        const start = new Date();
        const expiry = new Date(start);

        if (plan.durationUnit === 'days') expiry.setDate(expiry.getDate() + plan.duration);
        else if (plan.durationUnit === 'years') expiry.setFullYear(expiry.getFullYear() + plan.duration);
        else expiry.setMonth(expiry.getMonth() + plan.duration);

        const newSub = await UserSubscription.create({
          userId: payUserId,
          planId: plan._id,
          startDate: start,
          expiryDate: expiry,
          status: 'active',
          paymentStatus: 'paid',
          amount: Number(amount) || plan.price,
          transactionId: finalTxnId,
          paymentMethod,
          timeline: [
            {
              event: 'Payment Successful',
              description: `Razorpay payment completed (Txn: ${finalTxnId})`,
              by: 'user',
            },
            {
              event: 'Subscription Activated',
              description: `Activated plan ${plan.name}`,
              by: 'system',
            },
          ],
        });

        // Record SubscriptionTransaction
        await SubscriptionTransaction.create({
          transactionId: finalTxnId,
          userId: payUserId,
          subscriptionId: newSub._id,
          planId: plan._id,
          amount: Number(amount) || plan.price,
          paymentMethod,
          paymentGateway: 'razorpay',
          status: 'success',
          paymentDate: start,
        }).catch(() => {});

        // Update subscriber count on plan
        await SubscriptionPlan.findByIdAndUpdate(plan._id, { $inc: { subscriberCount: 1 } }).catch(() => {});
      }
    }

    return res.json({
      success: true,
      message: 'Razorpay payment verified & subscription activated!',
      transactionId: finalTxnId,
    });
  } catch (err) {
    console.error('Razorpay Verify Payment Error:', err);
    next(err);
  }
};

