const express = require('express');
const router  = express.Router();
const { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const auth = require('../middleware/auth');

router.post('/coupons/validate',  validateCoupon);
router.get('/coupons',            auth, getCoupons);
router.post('/coupons',           auth, createCoupon);
router.put('/coupons/:id',        auth, updateCoupon);
router.delete('/coupons/:id',     auth, deleteCoupon);

module.exports = router;
