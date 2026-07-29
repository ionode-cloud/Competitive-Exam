const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

router.get('/my-purchases', protect, ctrl.getMyPurchases);
router.get('/', protect, adminOnly, ctrl.getOrders);
router.post('/', protect, adminOnly, ctrl.createOrder);
router.get('/:id', protect, adminOnly, ctrl.getOrder);
router.put('/:id', protect, adminOnly, ctrl.updateOrder);
router.delete('/:id', protect, adminOnly, ctrl.deleteOrder);
router.patch('/:id/refund', protect, adminOnly, ctrl.refundOrder);

module.exports = router;
