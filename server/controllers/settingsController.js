const Settings = require('../models/Settings');

// @desc    Get global settings
// @route   GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default ones
    console.log(`[SETTINGS] Fetching settings for user: ${req.user.id}`);
    if (!settings) {
      console.log(`[SETTINGS] No settings found, creating default.`);
      settings = new Settings();
      await settings.save();
    }
    console.log(`[SETTINGS] Returning: ${JSON.stringify(settings)}`);
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
      settings.monthlyWorkingDays = req.body.monthlyWorkingDays ?? settings.monthlyWorkingDays;
      settings.halfDaySalaryRateLimit = halfDaySalaryRateLimit ?? settings.halfDaySalaryRateLimit;
      settings.fullDaySalaryRateLimit = fullDaySalaryRateLimit ?? settings.fullDaySalaryRateLimit;
      settings.saturdayRule = req.body.saturdayRule ?? settings.saturdayRule;
      settings.permissionTier1Limit = req.body.permissionTier1Limit ?? settings.permissionTier1Limit;
      settings.permissionTier1Deduction = req.body.permissionTier1Deduction ?? settings.permissionTier1Deduction;
      settings.permissionTier2Limit = req.body.permissionTier2Limit ?? settings.permissionTier2Limit;
      settings.permissionTier2Deduction = req.body.permissionTier2Deduction ?? settings.permissionTier2Deduction;
      settings.updatedAt = Date.now();
      
      await settings.save();
    } else {
      // Create new settings
      settings = new Settings({
        monthlyPermissionHours,
        casualLeaveLimit,
        monthlyWorkingDays: req.body.monthlyWorkingDays,
        halfDaySalaryRateLimit,
        fullDaySalaryRateLimit,
        saturdayRule: req.body.saturdayRule,
        permissionTier1Limit: req.body.permissionTier1Limit,
        permissionTier1Deduction: req.body.permissionTier1Deduction,
        permissionTier2Limit: req.body.permissionTier2Limit,
        permissionTier2Deduction: req.body.permissionTier2Deduction
      });
      await settings.save();
    }

    console.log(`[SETTINGS] Settings updated successfully: ${JSON.stringify(settings)}`);
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
