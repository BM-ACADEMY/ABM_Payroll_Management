const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { format, parse } = require('date-fns');

// @desc    Mark attendance (WFH/WFO)
exports.checkIn = async (req, res) => {
  const { mode } = req.body;
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = format(new Date(), 'HH:mm');

  try {
    const user = await User.findById(req.user.id);
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });

    if (attendance) return res.status(400).json({ msg: 'Already checked in today' });

    // Login logic: 9:30 base, 15m grace. 9:46 -> 16m permission.
    const loginTime = parse(user.timingSettings.loginTime, 'HH:mm', new Date());
    const currentTime = parse(now, 'HH:mm', new Date());
    const diff = (currentTime - loginTime) / (1000 * 60);

    let permissionMinutes = 0;
    let status = 'on-time';

    if (diff > user.timingSettings.graceTime) {
      permissionMinutes = diff; // Include grace time if exceeded
      status = 'late';
    }

    attendance = new Attendance({
      user: req.user.id,
      date: today,
      checkIn: { time: now, mode, status, permissionMinutes }
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
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = format(new Date(), 'HH:mm');

  try {
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });
    if (!attendance) return res.status(404).json({ msg: 'Attendance record not found' });
    if (!attendance.lunch.out) return res.status(400).json({ msg: 'Please mark lunch out first' });
    if (attendance.lunch.in) return res.status(400).json({ msg: 'Lunch in already marked' });

    attendance.lunch.in = now;
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Mark Check Out
exports.checkOut = async (req, res) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = format(new Date(), 'HH:mm');

  try {
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });
    if (!attendance) return res.status(404).json({ msg: 'Attendance record not found' });
    if (attendance.checkOut.time) return res.status(400).json({ msg: 'Already checked out today' });

    attendance.checkOut.time = now;

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
