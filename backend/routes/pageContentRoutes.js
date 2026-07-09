const express = require('express');
const router = express.Router();
const pageContentController = require('../controllers/pageContentController');
const authMiddleware = require('../middleware/auth');

router.get('/page-content/:page', pageContentController.getPageContent);
router.put('/page-content/:page', authMiddleware, pageContentController.updatePageContent);

module.exports = router;
