const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const adminCtrl = require('../controllers/subjectTestController');
const examCtrl  = require('../controllers/subjectTestExamController');

/* ── PUBLIC STUDENT ENDPOINTS ───────────────────────────────────────────────── */
router.get('/config', adminCtrl.getConfig);
router.get('/categories/public', adminCtrl.getCategoriesDropdown);
router.get('/public/tree', examCtrl.getPublicSubjectTree);
router.get('/tests/:testId/instructions', examCtrl.getTestInstructions);

/* ── PROTECTED STUDENT EXAM ENDPOINTS ───────────────────────────────────────── */
router.post('/tests/:testId/start', protect, examCtrl.startExamAttempt);
router.get('/attempts/:attemptId', protect, examCtrl.getExamAttempt);
router.post('/attempts/:attemptId/answer', protect, examCtrl.saveAnswer);
router.post('/attempts/:attemptId/submit', protect, examCtrl.submitExamAttempt);
router.get('/attempts/:attemptId/result', protect, examCtrl.getExamAttemptResult);

/* ── ADMIN MANAGEMENT ENDPOINTS (Require Admin Authorization) ───────────────── */
// Banner & Settings Config
router.get('/config/admin', protect, adminOnly, adminCtrl.getConfig);
router.put('/config', protect, adminOnly, adminCtrl.updateConfig);

router.get('/dashboard/stats', protect, adminOnly, adminCtrl.getDashboardStats);

// Subject Test Categories
router.get('/subjects', protect, adminOnly, adminCtrl.getSubjects);
router.post('/subjects', protect, adminOnly, adminCtrl.createSubject);
router.put('/subjects/reorder', protect, adminOnly, adminCtrl.reorderSubjects);
router.put('/subjects/:id', protect, adminOnly, adminCtrl.updateSubject);
router.delete('/subjects/:id', protect, adminOnly, adminCtrl.deleteSubject);

// Topics
router.get('/topics', protect, adminOnly, adminCtrl.getTopics);
router.post('/topics', protect, adminOnly, adminCtrl.createTopic);
router.put('/topics/:id', protect, adminOnly, adminCtrl.updateTopic);
router.delete('/topics/:id', protect, adminOnly, adminCtrl.deleteTopic);

// Tests
router.get('/tests', protect, adminOnly, adminCtrl.getTests);
router.get('/tests/:id', protect, adminOnly, adminCtrl.getTest);
router.post('/tests', protect, adminOnly, adminCtrl.createTest);
router.put('/tests/:id', protect, adminOnly, adminCtrl.updateTest);
router.patch('/tests/:id/publish', protect, adminOnly, adminCtrl.publishTest);
router.delete('/tests/:id', protect, adminOnly, adminCtrl.deleteTest);
router.put('/tests/:testId/instructions', protect, adminOnly, adminCtrl.updateInstruction);

// Question Bank & Mapping
router.get('/questions', protect, adminOnly, adminCtrl.getQuestions);
router.post('/questions', protect, adminOnly, adminCtrl.createQuestion);
router.put('/questions/:id', protect, adminOnly, adminCtrl.updateQuestion);
router.delete('/questions/:id', protect, adminOnly, adminCtrl.deleteQuestion);
router.post('/questions/bulk-import', protect, adminOnly, adminCtrl.bulkImportQuestions);

// Test Question Mapping & Auto Selection
router.post('/tests/:testId/questions', protect, adminOnly, adminCtrl.addQuestionsToTest);
router.post('/tests/:testId/questions/auto-select', protect, adminOnly, adminCtrl.autoSelectQuestions);
router.delete('/tests/:testId/questions/:questionId', protect, adminOnly, adminCtrl.removeQuestionFromTest);
router.put('/tests/:testId/questions/reorder', protect, adminOnly, adminCtrl.reorderTestQuestions);

module.exports = router;
