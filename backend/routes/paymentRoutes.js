const express  = require('express');
const router   = express.Router();
const { createOrder, verifyPayment, getUserPurchases, getRevenueStats, getAllPayments } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/payments/create-order',     createOrder);
router.post('/payments/verify',           verifyPayment);
router.get('/payments/user/:userId',      getUserPurchases);
router.get('/payments/stats/revenue',     auth, getRevenueStats);
router.get('/payments',                   auth, getAllPayments);

module.exports = router;
