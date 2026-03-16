const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// @route   POST api/attendance/checkin
// @desc    Mark attendance (WFH/WFO)
router.post('/checkin', auth, attendanceController.checkIn);

module.exports = router;
