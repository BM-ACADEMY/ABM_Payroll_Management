const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  weekStartDate: { type: String, required: true }, // Format: YYYY-MM-DD (usually a Monday)
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId },
      questionText: { type: String },
      creditsReceived: { type: Number, default: 0 },
      maxCredits: { type: Number }
    }
  ],
  totalCredits: { type: Number, default: 0 },
  feedback: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure one score per user per team per week
ScoreSchema.index({ user: 1, team: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('Score', ScoreSchema);
