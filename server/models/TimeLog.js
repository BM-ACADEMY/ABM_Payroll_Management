const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['running', 'paused', 'completed'],
    default: 'running'
  },
  pauses: [{
    pauseStart: Date,
    pauseEnd: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TimeLog', TimeLogSchema);
