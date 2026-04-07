const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const attendanceController = require('../controllers/attendanceController');
const checkPermission = require('../middleware/checkPermission');

// @route   GET api/attendance/today
router.get('/today', auth, attendanceController.getTodayAttendance);

// @route   POST api/attendance/checkin
router.post('/checkin', auth, attendanceController.checkIn);

// @route   POST api/attendance/lunchout
router.post('/lunchout', auth, attendanceController.lunchOut);

// @route   POST api/attendance/lunchin
router.post('/lunchin', auth, attendanceController.lunchIn);

// @route   POST api/attendance/checkout
router.post('/checkout', auth, attendanceController.checkOut);

// @route   GET api/attendance/logs
router.get('/logs', auth, attendanceController.getAllLogs);

// @desc    Get all attendance records for a specific date (Admin)
// @route   GET api/attendance/admin/all
router.get('/admin/all', [auth, isAdmin, checkPermission('attendance', 'read')], attendanceController.getAllAttendance);

// @desc    Mark attendance for an employee manually (Admin)
// @route   POST api/attendance/admin/emergency
router.post('/admin/emergency', [auth, isAdmin, checkPermission('attendance', 'update')], attendanceController.emergencyAttendance);

// @route   GET api/attendance/calendar
router.get('/calendar', auth, attendanceController.getMonthlyCalendar);

module.exports = router;
