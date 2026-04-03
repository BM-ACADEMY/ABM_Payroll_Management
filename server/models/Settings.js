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
  monthlyWorkingDays: {
    type: Number,
    default: 30
  },
  halfDaySalaryRateLimit: { 
    type: Number, 
    default: 0.5 
  },
  fullDaySalaryRateLimit: { 
    type: Number, 
    default: 1.0 
  },
  saturdayRule: {
    type: String,
    enum: ['holiday', 'half-day', 'full-day'],
    default: 'full-day'
  },
  permissionTier1Limit: { 
    type: Number, 
    default: 3 
  }, // hours
  permissionTier1Deduction: { 
    type: Number, 
    default: 0.5 
  }, // days
  permissionTier2Limit: { 
    type: Number, 
    default: 5 
  }, // hours
  permissionTier2Deduction: { 
    type: Number, 
    default: 1.0 
  }, // days
  taskTimeLimit: {
    type: Number,
    default: 8 // default 8 hours
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
