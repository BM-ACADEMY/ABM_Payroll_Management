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
