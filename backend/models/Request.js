const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['leave', 'permission', 'lunch_delay'], required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String }, // For permission
  endTime: { type: String }, // For permission
  duration: { type: Number }, // in days for leave, in minutes for permission
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);
