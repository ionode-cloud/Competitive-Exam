const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { adminOnly, superAdminOnly } = require('../middleware/rbac');

router.get('/', protect, adminOnly, ctrl.getStudents);
router.get('/export', protect, adminOnly, ctrl.exportStudents);
router.get('/:id', protect, adminOnly, ctrl.getStudent);
router.delete('/:id', protect, superAdminOnly, ctrl.deleteStudent);
router.patch('/:id/ban', protect, adminOnly, ctrl.banStudent);
router.patch('/:id/unban', protect, adminOnly, ctrl.unbanStudent);
router.get('/admins/list', protect, adminOnly, ctrl.getAdminUsers);
router.post('/admins/create', protect, superAdminOnly, ctrl.createAdminUser);
router.put('/admins/:id', protect, superAdminOnly, ctrl.updateAdminUser);
router.delete('/admins/:id', protect, superAdminOnly, ctrl.deleteAdminUser);

module.exports = router;
