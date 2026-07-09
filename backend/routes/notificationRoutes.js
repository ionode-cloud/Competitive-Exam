const express = require('express');
const router  = express.Router();
const {
  getUserNotifications, markAsRead, markAllRead,
  createNotification, getAllNotifications
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/notifications/user/:userId',      getUserNotifications);
router.patch('/notifications/:id/read',        markAsRead);
router.patch('/notifications/user/:userId/read-all', markAllRead);
router.post('/notifications',                  auth, createNotification);
router.get('/notifications',                   auth, getAllNotifications);

module.exports = router;
