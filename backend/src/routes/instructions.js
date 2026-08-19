const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getInstructions,
  getInstruction,
  createInstruction,
  updateInstruction,
  deleteInstruction,
} = require('../controllers/instructionController');

// Public route to get instructions list with filters (also used by admin)
router.get('/', getInstructions);
router.get('/:id', getInstruction);

// Protected admin routes
router.use(protect);
router.use(authorize('admin', 'superadmin', 'sub_admin', 'content_manager'));

router.post('/', createInstruction);
router.put('/:id', updateInstruction);
router.delete('/:id', deleteInstruction);

module.exports = router;
