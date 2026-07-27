const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');
const { adminOnly, questionCreator } = require('../middleware/rbac');

router.get('/', protect, adminOnly, ctrl.getChapters);
router.post('/', protect, questionCreator, ctrl.createChapter);
router.put('/:id', protect, questionCreator, ctrl.updateChapter);
router.delete('/:id', protect, questionCreator, ctrl.deleteChapter);
router.get('/tree/:subjectId', protect, adminOnly, ctrl.getChapterTree);

module.exports = router;
