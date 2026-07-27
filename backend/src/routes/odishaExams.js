const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/odishaExamController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

router.get('/', protect, adminOnly, ctrl.getOdishaExams);
router.get('/options', protect, adminOnly, ctrl.getDropdownOptions);
router.post('/', protect, adminOnly, ctrl.createOdishaExam);
router.put('/:id', protect, adminOnly, ctrl.updateOdishaExam);
router.delete('/:id', protect, adminOnly, ctrl.deleteOdishaExam);

module.exports = router;
