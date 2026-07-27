const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/pyqCategoryController');
const { protect }        = require('../middleware/auth');
const { contentManager } = require('../middleware/rbac');

// Public route for fetching categories
router.get('/', ctrl.getPyqCategories);

// Admin / Content Manager routes
router.post('/', protect, contentManager, ctrl.createPyqCategory);
router.put('/reorder', protect, contentManager, ctrl.reorderPyqCategories);
router.put('/:id', protect, contentManager, ctrl.updatePyqCategory);
router.delete('/:id', protect, contentManager, ctrl.deletePyqCategory);

module.exports = router;
