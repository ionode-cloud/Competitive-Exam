const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/materialsConfigController');
const { protect }        = require('../middleware/auth');
const { contentManager } = require('../middleware/rbac');

// Public — for user-facing MaterialsPage
router.get('/public', ctrl.getPublicConfig);

// Admin CRUD
router.get('/',   protect, contentManager, ctrl.getConfig);
router.put('/',   protect, contentManager, ctrl.updateConfig);

module.exports = router;
