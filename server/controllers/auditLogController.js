const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs for the logged-in user
// @route   GET /api/audit-logs
exports.getMyAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all audit logs (Admin)
// @route   GET /api/audit-logs/admin
exports.getAllAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
