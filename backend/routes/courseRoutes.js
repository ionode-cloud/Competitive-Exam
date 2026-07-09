const express = require('express');
const router  = express.Router();
const {
  getCourses, getCourseById, createCourse, updateCourse, deleteCourse,
  getCategories, createCategory, updateCategory, deleteCategory, getCourseStats
} = require('../controllers/courseController');
const auth = require('../middleware/auth');

// Categories
router.get('/categories',          getCategories);
router.post('/categories',         auth, createCategory);
router.put('/categories/:id',      auth, updateCategory);
router.delete('/categories/:id',   auth, deleteCategory);

// Courses
router.get('/courses',             getCourses);
router.get('/courses/:id',         getCourseById);
router.post('/courses',            auth, createCourse);
router.put('/courses/:id',         auth, updateCourse);
router.delete('/courses/:id',      auth, deleteCourse);
router.get('/courses/:id/stats',   auth, getCourseStats);

module.exports = router;
