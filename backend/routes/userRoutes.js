const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { register, verifyOtp, login, getProfile, updateProfile } = require('../controllers/userController');

// User auth middleware — verifies JWT and sets req.userId
const userAuth = (req, res, next) => {
  const auth = req.header('Authorization');
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

router.post('/users/register',   register);
router.post('/users/verify-otp', verifyOtp);
router.post('/users/login',      login);
router.get ('/users/profile',    userAuth, getProfile);
router.put ('/users/profile',    userAuth, updateProfile);

module.exports = router;
