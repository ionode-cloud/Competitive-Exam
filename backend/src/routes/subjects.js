const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');
const { adminOnly, contentManager } = require('../middleware/rbac');

router.get('/dropdown', ctrl.getSubjectsDropdown);
router.get('/', protect, adminOnly, ctrl.getSubjects);
router.get('/:id', protect, adminOnly, ctrl.getSubject);
router.post('/', protect, contentManager, ctrl.createSubject);
router.put('/reorder', protect, contentManager, ctrl.reorderSubjects);
router.put('/:id', protect, contentManager, ctrl.updateSubject);
router.delete('/:id', protect, contentManager, ctrl.deleteSubject);

module.exports = router;
