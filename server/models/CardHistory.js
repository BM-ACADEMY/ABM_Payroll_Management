const mongoose = require('mongoose');

const CardHistorySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // Created, Moved, Updated, Deleted, etc.
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CardHistory', CardHistorySchema);
