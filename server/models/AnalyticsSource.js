const mongoose = require('mongoose');

const AnalyticsSourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  statusCol: {
    type: String, // Letter like 'F'
    required: true,
    default: 'A'
  },
  handlerCol: {
    type: String, // Letter like 'H'
    required: true,
    default: 'B'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AnalyticsSource', AnalyticsSourceSchema);
