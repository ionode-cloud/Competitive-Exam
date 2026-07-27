const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/subscriptionConfigController');
const { protect }        = require('../middleware/auth');
const { contentManager } = require('../middleware/rbac');

// Public — no auth required (user-facing SubscriptionPage)
router.get('/public', ctrl.getPublicConfig);

// Admin CRUD
router.get('/',  protect, contentManager, ctrl.getConfig);
router.put('/',  protect, contentManager, ctrl.updateConfig);

module.exports = router;
