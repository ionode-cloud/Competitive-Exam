const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Forgot password and Login are prefixed with '/admin'
router.post('/admin/forgot-password/send-otp', adminController.forgotPasswordSendOtp);
router.post('/admin/forgot-password/verify-otp', adminController.forgotPasswordVerifyOtp);
router.post('/admin/forgot-password/reset', adminController.forgotPasswordReset);
router.post('/admin/login', adminController.adminLogin);

// Admins list/create are not prefixed with '/admin'
router.get('/admins', authMiddleware, adminController.getAdmins);
router.post('/admins', authMiddleware, adminController.createAdmin);
router.put('/admins/:id', authMiddleware, adminController.updateAdmin);
router.delete('/admins/:id', authMiddleware, adminController.deleteAdmin);

module.exports = router;

