const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Request = require('../models/Request');
const CompanyLeave = require('../models/CompanyLeave');
const Settings = require('../models/Settings');
const { format, parse, startOfDay, addMinutes, startOfMonth, endOfMonth, eachDayOfInterval, isSunday, isSaturday, isSameDay } = require('date-fns');

// @desc    Mark attendance (WFH/WFO)
// @route   POST /api/attendance/checkin
exports.checkIn = async (req, res) => {
  const { mode, lateReason } = req.body;
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = format(new Date(), 'HH:mm');

  try {
    const user = await User.findById(req.user.id);
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });

    if (attendance) return res.status(400).json({ msg: 'Already checked in today' });

    // Login logic: e.g. 9:30 base, 15m grace. 9:46 -> 16m permission.
    const loginTimeStr = user.timingSettings.loginTime || '09:30';
    const loginTimeParts = loginTimeStr.split(':');
    const expectedLoginDate = startOfDay(new Date());
    expectedLoginDate.setHours(parseInt(loginTimeParts[0]), parseInt(loginTimeParts[1]), 0);

    const currentTime = new Date();
    const graceTimeLimit = addMinutes(expectedLoginDate, user.timingSettings.graceTime || 15);

    let permissionMinutes = 0;
    let status = 'on-time';

    if (currentTime > graceTimeLimit) {
      if (!lateReason) {
        return res.status(400).json({ msg: 'Reason is required for late check-in' });
      }
      status = 'late';
      // Calculate from the exact expected login time to now
      permissionMinutes = (currentTime - expectedLoginDate) / (1000 * 60);

      // Create a permission request automatically
      const fromDateTime = expectedLoginDate;
      const toDateTime = currentTime;
      
      const totalMinutes = Math.floor(permissionMinutes);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const totalPermissionTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hrs`;

      const newRequest = new Request({
        user: req.user.id,
        type: 'late_login',
        date: today,
        fromDateTime,
        toDateTime,
        duration: totalMinutes,
        totalPermissionTime,
        reason: lateReason,
        status: 'pending'
      });
      await newRequest.save();

      // Emit real-time notification
      if (req.io) {
        req.io.emit('new_request', { user: req.user.id });
      }
    }

    attendance = new Attendance({
      user: req.user.id,
      date: today,
      checkIn: { 
        time: now, 
        mode, 
        status, 
        permissionMinutes: Math.ceil(permissionMinutes) 
      }
    });

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
// @desc    Mark Lunch Out
exports.lunchOut = async (req, res) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = format(new Date(), 'HH:mm');

  try {
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });
    if (!attendance) return res.status(404).json({ msg: 'Attendance record not found. Please check in first.' });
    if (attendance.lunch.out) return res.status(400).json({ msg: 'Lunch out already marked' });

    attendance.lunch.out = now;
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Mark Lunch In
exports.lunchIn = async (req, res) => {
  const { delayReason } = req.body;
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = format(new Date(), 'HH:mm');

  try {
    const user = await User.findById(req.user.id);
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });
    if (!attendance) return res.status(404).json({ msg: 'Attendance record not found' });
    if (!attendance.lunch.out) return res.status(400).json({ msg: 'Please mark lunch out first' });
    if (attendance.lunch.in) return res.status(400).json({ msg: 'Lunch in already marked' });

    // Calculate lunch duration
    const lunchOutTime = parse(attendance.lunch.out, 'HH:mm', new Date());
    const lunchInTime = parse(now, 'HH:mm', new Date());
    const duration = (lunchInTime - lunchOutTime) / (1000 * 60);
    const maxDuration = user.timingSettings.lunchDuration || 45;

    if (duration > maxDuration && !delayReason) {
      return res.status(400).json({ msg: 'Reason is required for lunch delay' });
    }

    attendance.lunch.in = now;

    if (duration > maxDuration || delayReason) {
      const extraMinutes = Math.max(0, Math.ceil(duration - maxDuration));
      
      // Create permission request for lunch delay
      const newRequest = new Request({
        user: req.user.id,
        type: 'lunch_delay',
        date: today,
        fromDateTime: lunchOutTime,
        toDateTime: lunchInTime,
        duration: extraMinutes > 0 ? extraMinutes : duration,
        totalPermissionTime: `${Math.floor(duration/60).toString().padStart(2, '0')}:${(Math.floor(duration)%60).toString().padStart(2, '0')} hrs`,
        reason: delayReason || 'Lunch Delay',
        status: 'pending'
      });
      await newRequest.save();
      
      attendance.checkIn.permissionMinutes = (attendance.checkIn.permissionMinutes || 0) + extraMinutes;
    }

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Mark Check Out
exports.checkOut = async (req, res) => {
  const { reason } = req.body;
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = format(new Date(), 'HH:mm');

  try {
    const user = await User.findById(req.user.id);
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });
    if (!attendance) return res.status(404).json({ msg: 'Attendance record not found' });
    if (attendance.checkOut.time) return res.status(400).json({ msg: 'Already checked out today' });

    attendance.checkOut.time = now;

    // Early Logout Logic
    const lunchStartTimeStr = user.timingSettings.lunchStart || '13:30';
    const lunchStartParts = lunchStartTimeStr.split(':');
    const scheduledLunchStart = startOfDay(new Date());
    scheduledLunchStart.setHours(parseInt(lunchStartParts[0]), parseInt(lunchStartParts[1]), 0);

    const currentTime = new Date();

    if (currentTime < scheduledLunchStart && !reason) {
      return res.status(400).json({ msg: 'Reason is required for early logout' });
    }

    if (currentTime < scheduledLunchStart) {
      // Logout before lunch: Permission (now to lunchStart) + Half-day leave
      const diffInMs = scheduledLunchStart - currentTime;
      const permissionMins = Math.ceil(diffInMs / (1000 * 60));

      // 1. Permission for interval to lunch
      const permRequest = new Request({
        user: req.user.id,
        type: 'early_logout_permission',
        date: today,
        fromDateTime: currentTime,
        toDateTime: scheduledLunchStart,
        duration: permissionMins,
        totalPermissionTime: `${Math.floor(permissionMins/60).toString().padStart(2, '0')}:${(permissionMins%60).toString().padStart(2, '0')} hrs`,
        reason: reason || 'Early Logout (Before Lunch)',
        status: 'pending'
      });
      await permRequest.save();

      // 2. Half-day leave for second half
      const leaveRequest = new Request({
        user: req.user.id,
        type: 'leave',
        date: today,
        duration: 0.5,
        reason: reason || 'Early Logout (Second Half)',
        status: 'approved' // Automatically approved as per logic? Or pending?
        // User said: "second half should be added as half day leave."
      });
      await leaveRequest.save();

      attendance.checkIn.permissionMinutes = (attendance.checkIn.permissionMinutes || 0) + permissionMins;
    }

    // Calculate working minutes
    const checkInTime = parse(attendance.checkIn.time, 'HH:mm', new Date());
    const checkOutTime = parse(now, 'HH:mm', new Date());
    let totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);

    // Subtract lunch time if applicable
    if (attendance.lunch.out && attendance.lunch.in) {
      const lunchOutTime = parse(attendance.lunch.out, 'HH:mm', new Date());
      const lunchInTime = parse(attendance.lunch.in, 'HH:mm', new Date());
      const lunchMinutes = (lunchInTime - lunchOutTime) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    }

    attendance.totalWorkingMinutes = Math.max(0, totalMinutes);
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get today's attendance status
exports.getTodayAttendance = async (req, res) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    const attendance = await Attendance.findOne({ user: req.user.id, date: today });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
// @desc    Get all attendance logs for an employee
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await Attendance.find({ user: req.user.id }).sort({ date: -1 }).limit(30);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all attendance records for a specific date (Admin)
exports.getAllAttendance = async (req, res) => {
  const { date } = req.query;
  try {
    const attendance = await Attendance.find({ date })
      .populate('user', 'name employeeId phoneNumber email')
      .sort({ 'user.name': 1 });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get monthly calendar for an employee
// @route   GET /api/attendance/calendar
exports.getMonthlyCalendar = async (req, res) => {
  const { month, year } = req.query; // e.g. 3, 2026
  
  try {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);
    
    // Get all days in month
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Fetch data for the user
    const attendanceRecords = await Attendance.find({
      user: req.user.id,
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });
    
    const requests = await Request.find({
      user: req.user.id,
      status: 'approved',
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });
    
    const companyLeaves = await CompanyLeave.find({
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });
    
    const globalSettings = await Settings.findOne();
    const saturdayRule = globalSettings?.saturdayRule || 'full-day';
    
    const calendarData = daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const attendance = attendanceRecords.find(a => a.date === dateStr);
      const approvedRequest = requests.find(r => r.date === dateStr);
      const companyLeave = companyLeaves.find(cl => cl.date === dateStr);
      
      let type = 'workday';
      let details = null;
      let status = '';
      
      if (isSunday(day)) {
        type = 'holiday';
        status = 'Sunday';
      } else if (companyLeave) {
        type = 'holiday';
        status = companyLeave.reason;
      } else if (isSaturday(day)) {
        if (saturdayRule === 'holiday') {
          type = 'holiday';
          status = 'Saturday (Holiday)';
        } else if (saturdayRule === 'half-day') {
          type = 'half-day';
          status = 'Saturday (Half-day)';
        } else {
          type = 'workday';
        }
      }
      
      if (attendance) {
        details = {
          checkIn: attendance.checkIn?.time,
          checkOut: attendance.checkOut?.time,
          lunchOut: attendance.lunch?.out,
          lunchIn: attendance.lunch?.in,
          status: attendance.checkIn?.status
        };
        if (attendance.checkIn?.status === 'late') {
          status = status ? `${status} / Late` : 'Late';
        }
      }
      
      if (approvedRequest) {
        type = approvedRequest.type === 'leave' ? 'leave' : type;
        status = approvedRequest.reason;
        details = { ...details, requestType: approvedRequest.type, duration: approvedRequest.duration || approvedRequest.totalPermissionTime };
      }
      
      return {
        date: dateStr,
        day: format(day, 'dd'),
        dayName: format(day, 'EEE'),
        type,
        status,
        details
      };
    });
    
    res.json(calendarData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
