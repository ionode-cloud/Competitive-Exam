const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const { paginate, paginateResponse } = require('../utils/pagination');

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      Notification.find().sort('-createdAt').skip(skip).limit(lim).populate('sentBy', 'name'),
      Notification.countDocuments(),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { title, message, type, targetType, targetUsers, targetSubject, scheduledAt, imageUrl, actionUrl } = req.body;

    let recipients = [];
    if (targetType === 'all') {
      recipients = await User.find({ role: 'student', isActive: true }).distinct('_id');
    } else if (targetType === 'selected' && targetUsers?.length) {
      recipients = targetUsers;
    } else if (targetType === 'by_subject' && targetSubject) {
      recipients = await User.find({ purchasedCourses: targetSubject }).distinct('_id');
    }

    const notification = await Notification.create({
      title, message, type, targetType,
      targetUsers: recipients,
      targetSubject,
      sentBy: req.user._id,
      status: scheduledAt ? 'scheduled' : 'sent',
      scheduledAt: scheduledAt || null,
      sentAt: scheduledAt ? null : new Date(),
      totalRecipients: recipients.length,
      imageUrl, actionUrl,
    });

    res.status(201).json({ success: true, data: notification, message: `Notification sent to ${recipients.length} recipients` });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
