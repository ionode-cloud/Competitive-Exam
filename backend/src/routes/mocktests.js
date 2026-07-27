const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mockTestController');
const { protect } = require('../middleware/auth');
const { adminOnly, contentManager } = require('../middleware/rbac');

router.delete('/bulk', protect, contentManager, ctrl.bulkDelete);
router.patch('/bulk-publish', protect, contentManager, ctrl.bulkPublish);
router.get('/public/tree', ctrl.getPublicMockTestsTree);
router.get('/', protect, adminOnly, ctrl.getMockTests);
router.get('/:id', protect, adminOnly, ctrl.getMockTest);
router.post('/', protect, contentManager, ctrl.createMockTest);
router.put('/:id', protect, contentManager, ctrl.updateMockTest);
router.delete('/:id', protect, contentManager, ctrl.deleteMockTest);
router.patch('/:id/publish', protect, contentManager, ctrl.publishMockTest);
router.post('/:id/duplicate', protect, contentManager, ctrl.duplicateMockTest);
router.patch('/:id/schedule', protect, contentManager, ctrl.scheduleMockTest);
router.post('/:id/questions', protect, contentManager, ctrl.addQuestions);
router.post('/:id/questions/direct', protect, contentManager, ctrl.addDirectQuestion);
router.delete('/:id/questions/:questionId', protect, contentManager, ctrl.removeQuestion);
router.patch('/:id/questions/reorder', protect, contentManager, ctrl.reorderQuestions);

module.exports = router;
