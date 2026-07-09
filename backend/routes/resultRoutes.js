const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authMiddleware = require('../middleware/auth');

router.post('/submit', resultController.submitTest);
router.get('/results', authMiddleware, resultController.getAllResults);
router.get('/results/stats/summary', authMiddleware, resultController.getResultStats);
router.get('/results/:studentId', resultController.getStudentResults);
router.delete('/results/all', authMiddleware, resultController.deleteAllResults);

module.exports = router;
