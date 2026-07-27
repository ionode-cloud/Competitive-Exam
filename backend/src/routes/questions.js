const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { adminOnly, questionCreator } = require('../middleware/rbac');
const { uploadImport } = require('../middleware/upload');

router.delete('/bulk', protect, questionCreator, ctrl.bulkDelete);
router.patch('/bulk-publish', protect, questionCreator, ctrl.bulkPublish);
router.post('/import', protect, questionCreator, uploadImport, ctrl.importQuestions);
router.get('/export-template', protect, adminOnly, ctrl.exportTemplate);
router.patch('/move', protect, questionCreator, ctrl.moveQuestions);
router.get('/', protect, adminOnly, ctrl.getQuestions);
router.get('/:id', protect, adminOnly, ctrl.getQuestion);
router.post('/', protect, questionCreator, ctrl.createQuestion);
router.put('/:id', protect, questionCreator, ctrl.updateQuestion);
router.delete('/:id', protect, questionCreator, ctrl.deleteQuestion);
router.post('/:id/duplicate', protect, questionCreator, ctrl.duplicateQuestion);

module.exports = router;
