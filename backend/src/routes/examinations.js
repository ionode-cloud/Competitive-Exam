const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examinationController');
const { protect } = require('../middleware/auth');
const { adminOnly, contentManager } = require('../middleware/rbac');

router.get('/dropdown', ctrl.getDropdown);
router.get('/', protect, adminOnly, ctrl.getExaminations);
router.get('/:id', protect, adminOnly, ctrl.getExamination);
router.post('/', protect, contentManager, ctrl.createExamination);
router.put('/:id', protect, contentManager, ctrl.updateExamination);
router.delete('/:id', protect, contentManager, ctrl.deleteExamination);

module.exports = router;
