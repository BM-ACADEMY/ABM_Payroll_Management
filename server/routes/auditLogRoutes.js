const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const auditLogController = require('../controllers/auditLogController');

// @route   GET api/audit-logs
// @desc    Get my audit logs
router.get('/', auth, auditLogController.getMyAuditLogs);

// @route   GET api/audit-logs/admin
// @desc    Get all audit logs (Admin only)
router.get('/admin', [auth, isAdmin], auditLogController.getAllAuditLogs);

module.exports = router;
