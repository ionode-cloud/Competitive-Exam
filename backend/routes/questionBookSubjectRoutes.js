const express = require('express');
const router = express.Router();
const controller = require('../controllers/questionBookSubjectController');
const authMiddleware = require('../middleware/auth');

// Public route to fetch eBook subjects
router.get('/ebook-subjects', controller.getSubjects);

// Admin-only protected routes
router.post('/ebook-subjects', authMiddleware, controller.createSubject);
router.put('/ebook-subjects/:id', authMiddleware, controller.updateSubject);
router.delete('/ebook-subjects/:id', authMiddleware, controller.deleteSubject);

module.exports = router;
