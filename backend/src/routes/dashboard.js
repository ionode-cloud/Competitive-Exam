const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

router.get('/', protect, adminOnly, getDashboardStats);

module.exports = router;
