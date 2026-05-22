const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

// Student login is prefixed with '/student'
router.post('/student/login', studentController.studentLogin);

// Students list/delete are not prefixed with '/student'
router.get('/students', authMiddleware, studentController.getStudents);
router.delete('/students/:id', authMiddleware, studentController.deleteStudent);
router.delete('/students/bulk/all', authMiddleware, studentController.deleteAllStudents);

module.exports = router;
