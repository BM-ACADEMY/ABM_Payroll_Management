const mongoose = require('mongoose');

const SitePhotoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  day: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance
SitePhotoSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('SitePhoto', SitePhotoSchema);
