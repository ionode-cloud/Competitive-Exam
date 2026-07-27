const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ebookConfigController');
const { protect }        = require('../middleware/auth');
const { contentManager } = require('../middleware/rbac');

router.get('/public', ctrl.getPublicConfig);
router.get('/', protect, contentManager, ctrl.getConfig);
router.put('/', protect, contentManager, ctrl.updateConfig);

module.exports = router;
