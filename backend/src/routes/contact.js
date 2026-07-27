const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const {
  createContactMessage,
  getContactMessages,
  updateContactStatus,
  deleteContactMessage,
} = require('../controllers/contactController');

// Public route to submit message
router.post('/', createContactMessage);

// Admin protected routes
router.use(protect);
router.use(adminOnly);

router.get('/', getContactMessages);
router.put('/:id/status', updateContactStatus);
router.patch('/:id/status', updateContactStatus);
router.delete('/:id', deleteContactMessage);

module.exports = router;
