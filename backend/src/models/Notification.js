const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['push', 'email', 'sms', 'in_app'], default: 'in_app' },
  targetType: { type: String, enum: ['all', 'selected', 'by_subject', 'by_purchase'], default: 'all' },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  targetSubject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'sent', 'failed', 'scheduled'], default: 'draft' },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  totalRecipients: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
  imageUrl: { type: String },
  actionUrl: { type: String },
  data: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
