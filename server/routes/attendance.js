const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const attendanceController = require('../controllers/attendanceController');

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
router.get('/admin/all', [auth, isAdmin], attendanceController.getAllAttendance);

// @route   GET api/attendance/calendar
router.get('/calendar', auth, attendanceController.getMonthlyCalendar);

module.exports = router;
