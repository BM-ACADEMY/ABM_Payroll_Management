const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['LOGIN', 'LOGOUT'],
    required: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster retrieval of user logs
AuditLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
