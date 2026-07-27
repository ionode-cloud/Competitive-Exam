const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ebookController');
const { protect } = require('../middleware/auth');
const { adminOnly, contentManager } = require('../middleware/rbac');
const { uploadMultiple } = require('../middleware/upload');

router.get('/public', ctrl.getPublicEBooks);
router.get('/public/:id', ctrl.getEBook);
router.get('/', protect, adminOnly, ctrl.getEBooks);
router.get('/:id', ctrl.getEBook);
router.post('/', protect, contentManager, uploadMultiple, ctrl.createEBook);
router.put('/:id', protect, contentManager, uploadMultiple, ctrl.updateEBook);
router.delete('/:id', protect, contentManager, ctrl.deleteEBook);
router.patch('/:id/download', ctrl.incrementDownload);

module.exports = router;
