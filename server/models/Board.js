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
  sop: {
    gitLinks: [{ label: { type: String }, url: { type: String } }],
    googleDocLinks: [{ label: { type: String }, url: { type: String } }],
    description: { type: String },
    attachments: [{
      name: { type: String },
      url: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  createdAt: { type: Date, default: Date.now },
  position: { type: Number, default: 0 }
});

module.exports = mongoose.model('Board', BoardSchema);
