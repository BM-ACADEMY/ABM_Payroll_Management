const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  monthlyPermissionHours: { 
    type: Number, 
    default: 3 
  },
  casualLeaveLimit: { 
    type: Number, 
    default: 1 
  },
  halfDaySalaryRateLimit: { 
    type: Number, 
    default: 0.5 
  },
  fullDaySalaryRateLimit: { 
    type: Number, 
    default: 1.0 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
