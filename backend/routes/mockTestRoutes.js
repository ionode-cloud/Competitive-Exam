const express = require('express');
const router  = express.Router();
const {
  getMockTestsByCourse, getMockTestById, createMockTest,
  updateMockTest, deleteMockTest, duplicateMockTest,
  toggleMockTestStatus, getAllMockTests, getPublicMockTests
} = require('../controllers/mockTestController');
const auth = require('../middleware/auth');

router.get('/mock-tests/public',             getPublicMockTests);        // public — no auth
router.get('/mock-tests',                    auth, getAllMockTests);
router.get('/mock-tests/course/:courseId',   getMockTestsByCourse);
router.get('/mock-tests/:id',                getMockTestById);
router.post('/mock-tests',                   auth, createMockTest);
router.put('/mock-tests/:id',                auth, updateMockTest);
router.delete('/mock-tests/:id',             auth, deleteMockTest);
router.post('/mock-tests/:id/duplicate',     auth, duplicateMockTest);
router.patch('/mock-tests/:id/toggle',       auth, toggleMockTestStatus);

module.exports = router;
