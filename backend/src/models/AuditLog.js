const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // CREATE, UPDATE, DELETE, PUBLISH, LOGIN, etc.
  resource: { type: String }, // MockTest, Question, Subject, etc.
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  resourceName: { type: String },
  previousState: { type: Object },
  newState: { type: Object },
  ipAddress: { type: String },
  userAgent: { type: String },
  description: { type: String },
}, { timestamps: true });

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
