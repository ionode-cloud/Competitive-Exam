const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const authMiddleware = require('../middleware/auth');

router.get('/questions', authMiddleware, questionController.getQuestions);
router.post('/questions', authMiddleware, questionController.createQuestion);
router.put('/questions/:id', authMiddleware, questionController.updateQuestion);
router.delete('/questions/bulk/topic', authMiddleware, questionController.deleteTopicQuestions);
router.delete('/questions/:id', authMiddleware, questionController.deleteQuestion);

module.exports = router;
