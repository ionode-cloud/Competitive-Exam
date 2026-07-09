const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/auth');

router.get('/subjects', subjectController.getSubjects);
router.post('/subjects', authMiddleware, subjectController.createSubject);
router.put('/subjects/:id', authMiddleware, subjectController.updateSubject);
router.delete('/subjects/:id', authMiddleware, subjectController.deleteSubject);

module.exports = router;
