const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  checkIn: {
    time: { type: String },
    mode: { type: String, enum: ['WFH', 'WFO'] },
    status: { type: String, enum: ['on-time', 'late', 'absent'] },
    permissionMinutes: { type: Number, default: 0 }
  },
  checkOut: {
    time: { type: String }
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

module.exports = mongoose.model('Attendance', AttendanceSchema);
