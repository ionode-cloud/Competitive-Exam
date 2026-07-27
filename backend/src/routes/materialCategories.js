const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/materialCategoryController');
const { protect }        = require('../middleware/auth');
const { contentManager } = require('../middleware/rbac');

// Public — for user-facing category filter tabs
router.get('/public', ctrl.getPublicCategories);

// Admin CRUD
router.get('/',       protect, contentManager, ctrl.getCategories);
router.post('/',      protect, contentManager, ctrl.createCategory);
router.put('/reorder',protect, contentManager, ctrl.reorderCategories);
router.put('/:id',    protect, contentManager, ctrl.updateCategory);
router.delete('/:id', protect, contentManager, ctrl.deleteCategory);

module.exports = router;
