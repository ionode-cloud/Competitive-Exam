const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

router.get('/', protect, adminOnly, ctrl.getOrders);
router.get('/:id', protect, adminOnly, ctrl.getOrder);
router.patch('/:id/refund', protect, adminOnly, ctrl.refundOrder);

module.exports = router;
