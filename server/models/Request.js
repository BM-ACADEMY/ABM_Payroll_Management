const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['leave', 'permission', 'lunch_delay'], required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String }, // For permission (legacy)
  endTime: { type: String }, // For permission (legacy)
  fromDateTime: { type: Date }, // For permission (new)
  toDateTime: { type: Date }, // For permission (new)
  duration: { type: Number }, // in days for leave, in minutes for permission
  totalPermissionTime: { type: String }, // formatted duration (e.g., "01:30 hrs")
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  verifyByAdminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedReason: { type: String },
  isApproved: { type: Boolean, default: false },
  isReadByAdmin: { type: Boolean, default: false },
  appliedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);
