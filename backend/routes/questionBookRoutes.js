const express = require('express');
const router  = express.Router();
const {
  getQuestionBooksList,
  getQuestionBookPdf,
  getAllQuestionBooksAdmin,
  createQuestionBook,
  updateQuestionBook,
  deleteQuestionBook
} = require('../controllers/questionBookController');

// Import middlewares
const adminAuth = require('../middleware/auth');
const userAuth  = require('../middleware/userAuth');

// Student / Public routes
router.get('/question-books', getQuestionBooksList);
router.get('/question-books/:id/pdf', userAuth, getQuestionBookPdf);

// Admin routes
router.get('/admin/question-books', adminAuth, getAllQuestionBooksAdmin);
router.post('/admin/question-books', adminAuth, createQuestionBook);
router.put('/admin/question-books/:id', adminAuth, updateQuestionBook);
router.delete('/admin/question-books/:id', adminAuth, deleteQuestionBook);

module.exports = router;
