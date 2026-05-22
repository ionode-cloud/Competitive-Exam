const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middleware/auth');

router.post('/exams', authMiddleware, examController.createExam);
router.put('/exams/:id/status', authMiddleware, examController.updateExamStatus);
router.delete('/exams/:id', authMiddleware, examController.deleteExam);
router.get('/exams', examController.getExams);
router.get('/exams/:id/instructions', examController.getExamInstructions);
router.put('/exams/:id/instructions', authMiddleware, examController.updateExamInstructions);

module.exports = router;
