const Settings = require('../models/Settings');

// @desc    Get global settings
// @route   GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update global settings
// @route   POST /api/settings
exports.updateSettings = async (req, res) => {
  const { 
    monthlyPermissionHours, 
    casualLeaveLimit, 
    halfDaySalaryRateLimit, 
    fullDaySalaryRateLimit 
  } = req.body;

  try {
    let settings = await Settings.findOne();

    if (settings) {
      // Update existing settings
      settings.monthlyPermissionHours = monthlyPermissionHours ?? settings.monthlyPermissionHours;
      settings.casualLeaveLimit = casualLeaveLimit ?? settings.casualLeaveLimit;
      settings.halfDaySalaryRateLimit = halfDaySalaryRateLimit ?? settings.halfDaySalaryRateLimit;
      settings.fullDaySalaryRateLimit = fullDaySalaryRateLimit ?? settings.fullDaySalaryRateLimit;
      settings.updatedAt = Date.now();
      
      await settings.save();
    } else {
      // Create new settings
      settings = new Settings({
        monthlyPermissionHours,
        casualLeaveLimit,
        halfDaySalaryRateLimit,
        fullDaySalaryRateLimit
      });
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
