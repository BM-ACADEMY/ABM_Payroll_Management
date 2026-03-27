const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // 'yyyy-MM-dd'
    required: true
  },
  loginTime: {
    type: String, // 'HH:mm'
    required: true
  },
  logoutTime: {
    type: String, 
    default: '18:30'
  },
  graceTime: {
    type: Number,
    default: 15
  },
  lunchStart: {
    type: String,
    default: '13:30'
  },
  lunchDuration: {
    type: Number,
    default: 45
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one schedule per user per day
ScheduleSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
