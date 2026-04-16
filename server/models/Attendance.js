const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  checkIn: {
    time: { type: String },
    mode: { type: String, enum: ['WFH', 'WFO'] },
    status: { type: String, enum: ['on-time', 'late', 'absent'] },
    permissionMinutes: { type: Number, default: 0 },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  checkOut: {
    time: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  lunch: {
    out: { type: String },
    in: { type: String },
    delayReason: { type: String },
    isDelayApproved: { type: Boolean, default: false },
    isDelayPending: { type: Boolean, default: false }
  },
  isHoliday: { type: Boolean, default: false },
  leaveStatus: { type: String, enum: ['none', 'leave', 'permission', 'half-day'], default: 'none' },
  totalWorkingMinutes: { type: Number, default: 0 }
});

// Indexes for faster lookups
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
