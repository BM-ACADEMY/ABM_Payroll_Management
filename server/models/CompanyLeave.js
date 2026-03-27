const mongoose = require('mongoose');

const CompanyLeaveSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  reason: { type: String, required: true },
  type: { type: String, enum: ['holiday', 'other'], default: 'holiday' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CompanyLeave', CompanyLeaveSchema);
