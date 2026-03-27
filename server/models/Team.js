const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  questions: [
    {
      text: { type: String, required: true },
      maxCredits: { type: Number, required: true, default: 0 }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', TeamSchema);
