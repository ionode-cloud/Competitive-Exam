const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

// Admin payment routes
router.get('/', protect, adminOnly, ctrl.getPayments);
router.get('/stats/revenue', protect, adminOnly, ctrl.getRevenueStats);

// Razorpay routes
router.get('/razorpay/key', ctrl.getRazorpayKey);
router.post('/razorpay/create-order', ctrl.createRazorpayOrder);
router.post('/razorpay/verify', ctrl.verifyRazorpayPayment);
router.post('/webhook', ctrl.razorpayWebhook);

module.exports = router;
