const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');
const { adminOnly, questionCreator } = require('../middleware/rbac');

router.get('/', protect, adminOnly, ctrl.getSubChapters);
router.post('/', protect, questionCreator, ctrl.createSubChapter);
router.put('/:id', protect, questionCreator, ctrl.updateSubChapter);
router.delete('/:id', protect, questionCreator, ctrl.deleteSubChapter);

module.exports = router;
