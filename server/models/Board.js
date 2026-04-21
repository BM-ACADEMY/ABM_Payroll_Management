const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['regular', 'daily', 'weekly'], default: 'regular' },
  status: { type: String, enum: ['Active', 'On Hold', 'Completed', 'Archived'], default: 'Active' },
  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Board', BoardSchema);
