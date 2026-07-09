const Notification = require('../models/Notification');

/* ─── GET USER NOTIFICATIONS ─── */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({
      $or: [{ user: userId }, { user: null }]  // personal + broadcasts
    }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

/* ─── MARK AS READ ─── */
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking notification' });
  }
};

/* ─── MARK ALL READ ─── */
const markAllRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany(
      { $or: [{ user: userId }, { user: null }] },
      { isRead: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking all read' });
  }
};

/* ─── CREATE NOTIFICATION (admin — broadcast or targeted) ─── */
const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;
    const notif = new Notification({
      user: userId || null,
      type: type || 'broadcast',
      title, message, link
    });
    await notif.save();
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Error creating notification' });
  }
};

/* ─── GET ALL NOTIFICATIONS (admin) ─── */
const getAllNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

/* ─── Utility: send notification (internal use) ─── */
const sendNotification = async ({ userId = null, type, title, message, link = '' }) => {
  try {
    const n = new Notification({ user: userId, type, title, message, link });
    await n.save();
  } catch (err) {
    console.error('sendNotification error:', err);
  }
};

module.exports = {
  getUserNotifications, markAsRead, markAllRead,
  createNotification, getAllNotifications, sendNotification
};
