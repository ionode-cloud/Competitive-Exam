const QuestionBook = require('../models/QuestionBook');
const User = require('../models/User');

/* ─── PUBLIC/STUDENT ENDPOINTS ─── */

// Get list of all active question books (excludes pdfData for size and security)
const getQuestionBooksList = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.subject) {
      filter.subject = req.query.subject;
    }
    const books = await QuestionBook.find(filter)
      .select('-pdfData')
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error('getQuestionBooksList error:', err);
    res.status(500).json({ message: 'Error fetching question books list' });
  }
};

// Retrieve full PDF base64 data for authorized students
const getQuestionBookPdf = async (req, res) => {
  try {
    const book = await QuestionBook.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    if (!book.isActive) {
      return res.status(403).json({ message: 'This E-Book is currently unavailable' });
    }

    // Free books can be viewed by anyone logged in
    if (book.isFree) {
      return res.json({ pdfData: book.pdfData });
    }

    // For premium, check if user is logged in and has purchased it
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPurchased = user.purchases.some(p => p && p.toString() === book._id.toString());
    if (!isPurchased) {
      return res.status(403).json({ message: 'Please purchase this E-Book to view the PDF.' });
    }

    res.json({ pdfData: book.pdfData });
  } catch (err) {
    console.error('getQuestionBookPdf error:', err);
    res.status(500).json({ message: 'Error retrieving PDF content' });
  }
};

/* ─── ADMIN ENDPOINTS ─── */

// Admin list (excludes pdfData to save bandwidth, can fetch full on edit or load together)
const getAllQuestionBooksAdmin = async (req, res) => {
  try {
    const books = await QuestionBook.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error('getAllQuestionBooksAdmin error:', err);
    res.status(500).json({ message: 'Error fetching question books' });
  }
};

// Create a new question book
const createQuestionBook = async (req, res) => {
  try {
    const { title, description, subject, pdfData, price, offerPrice, isFree, isActive } = req.body;
    if (!title || !subject || !pdfData) {
      return res.status(400).json({ message: 'Title, Subject and PDF file are required.' });
    }

    const newBook = new QuestionBook({
      title,
      description,
      subject,
      pdfData,
      price: price || 0,
      offerPrice: offerPrice || 0,
      isFree: isFree === true,
      isActive: isActive !== false,
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error('createQuestionBook error:', err);
    res.status(500).json({ message: 'Error creating question book' });
  }
};

// Update an existing question book
const updateQuestionBook = async (req, res) => {
  try {
    const { title, description, subject, pdfData, price, offerPrice, isFree, isActive } = req.body;
    const book = await QuestionBook.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Question book not found' });
    }

    if (title !== undefined) book.title = title;
    if (description !== undefined) book.description = description;
    if (subject !== undefined) book.subject = subject;
    if (pdfData !== undefined && pdfData !== '') book.pdfData = pdfData;
    if (price !== undefined) book.price = price;
    if (offerPrice !== undefined) book.offerPrice = offerPrice;
    if (isFree !== undefined) book.isFree = isFree;
    if (isActive !== undefined) book.isActive = isActive;

    await book.save();
    res.json(book);
  } catch (err) {
    console.error('updateQuestionBook error:', err);
    res.status(500).json({ message: 'Error updating question book' });
  }
};

// Delete a question book
const deleteQuestionBook = async (req, res) => {
  try {
    const book = await QuestionBook.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Question book not found' });
    }
    res.json({ message: 'Question book deleted successfully' });
  } catch (err) {
    console.error('deleteQuestionBook error:', err);
    res.status(500).json({ message: 'Error deleting question book' });
  }
};

module.exports = {
  getQuestionBooksList,
  getQuestionBookPdf,
  getAllQuestionBooksAdmin,
  createQuestionBook,
  updateQuestionBook,
  deleteQuestionBook
};
