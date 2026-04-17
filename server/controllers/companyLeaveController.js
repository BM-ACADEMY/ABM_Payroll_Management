const CompanyLeave = require('../models/CompanyLeave');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Role = require('../models/Role');

// @desc    Add company leave (Admin)
exports.addLeave = async (req, res) => {
  const { date, reason, type } = req.body;
  try {
    let leave = await CompanyLeave.findOne({ date });
    if (leave) return res.status(400).json({ msg: 'Leave already exists for this date' });

    leave = new CompanyLeave({ date, reason, type });
    await leave.save();

    // Find all users with 'employee' role
    const employeeRole = await Role.findOne({ name: 'employee' });
    const employees = await User.find({ 
      role: employeeRole._id,
      createdAt: { $lte: new Date(date) } 
    });


    // Mark attendance as leave for all employees
    const attendancePromises = employees.map(async (emp) => {
      let attendance = await Attendance.findOne({ user: emp._id, date });
      if (attendance) {
        attendance.isHoliday = true;
        attendance.leaveStatus = 'leave';
      } else {
        attendance = new Attendance({
          user: emp._id,
          date,
          isHoliday: true,
          leaveStatus: 'leave'
        });
      }
      return attendance.save();
    });

    await Promise.all(attendancePromises);

    // Create notifications for all employees
    const Notification = require('../models/Notification');
    const notificationPromises = employees.map(emp => {
      const newNotification = new Notification({
        user: emp._id,
        title: 'Work Off Announced',
        message: `A work off has been announced for ${date} due to: ${reason}`,
        type: 'info'
      });
      return newNotification.save();
    });
    await Promise.all(notificationPromises);

    // Emit real-time notification via Socket.io
    if (req.io) {
      req.io.emit('notification', {
        type: 'work_off',
        message: `Work off announced for ${date}`,
        date
      });
    }

    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all company leaves (Admin/Employee)
exports.getLeaves = async (req, res) => {
  try {
    const leaves = await CompanyLeave.find().sort({ date: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete company leave (Admin)
exports.deleteLeave = async (req, res) => {
  try {
    const leave = await CompanyLeave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });

    const date = leave.date;
    await leave.deleteOne();

    // Reset attendance records for that day (remove isHoliday/leave status)
    // Note: We might want to only delete if they didn't have a check-in, 
    // but usually company leaves mean no one worked.
    await Attendance.updateMany(
      { date, isHoliday: true, leaveStatus: 'leave' },
      { $set: { isHoliday: false, leaveStatus: 'none' } }
    );

    res.json({ msg: 'Leave removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
