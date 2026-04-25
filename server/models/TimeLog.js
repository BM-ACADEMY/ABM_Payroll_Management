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
    type: Date
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
    enum: ['pending', 'running', 'paused', 'completed'],
    default: 'running'
  },
  label: {
    type: String,
    enum: ['not yet started', 'pending', 'qc', 'requirement needed', 'in process', 'done', 'holded'],
    default: 'not yet started'
  },
  comments: [{
    text: { type: String, required: true },
    author: { type: String, required: true },
    mentions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      isRead: { type: Boolean, default: false }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  pauses: [{
    pauseStart: Date,
    pauseEnd: Date,
    label: String
  }],
  activityLog: [{
    type: { type: String, enum: ['play', 'pause'] },
    startTime: Date,
    endTime: Date,
    duration: Number,
    label: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TimeLog', TimeLogSchema);
