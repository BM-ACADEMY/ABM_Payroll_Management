const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const payrollController = require('../controllers/payrollController');
const checkPermission = require('../middleware/checkPermission');

// @route   GET api/payroll/report
// @desc    Get monthly payroll report
router.get('/report', [auth, isAdmin, checkPermission('payroll', 'read')], payrollController.getMonthlyReport);

// @route   GET api/payroll/my-summary
// @desc    Get current user's payroll summary
router.get('/my-summary', auth, payrollController.getMySummary);

// @route   GET api/payroll/generate/:employeeId
// @desc    Generate individual salary report
router.get('/generate/:employeeId', [auth, isAdmin, checkPermission('payroll', 'read')], payrollController.generateIndividualSalary);

module.exports = router;
