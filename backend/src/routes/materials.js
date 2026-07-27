const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/materialController');
const { protect } = require('../middleware/auth');
const { adminOnly, contentManager } = require('../middleware/rbac');
const { uploadMultiple } = require('../middleware/upload');

// Public route (no auth) — published materials only
router.get('/public',      ctrl.getPublicMaterials);

// Admin-protected routes
router.get('/',            protect, adminOnly,      ctrl.getMaterials);
router.get('/:id',         protect, adminOnly,      ctrl.getMaterial);
router.post('/',           protect, contentManager, uploadMultiple, ctrl.createMaterial);
router.put('/:id',         protect, contentManager, uploadMultiple, ctrl.updateMaterial);
router.delete('/:id',      protect, contentManager, ctrl.deleteMaterial);
router.patch('/:id/download', ctrl.incrementDownload);

module.exports = router;
