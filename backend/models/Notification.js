const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = broadcast
  type:      {
    type: String,
    enum: [
      'registration', 'payment_success', 'payment_failed',
      'new_course', 'new_mock_test', 'exam_scheduled',
      'result_published', 'certificate_ready', 'broadcast'
    ],
    default: 'broadcast'
  },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  isRead:    { type: Boolean, default: false },
  link:      { type: String, default: '' },   // optional deep link
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
