const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Role = require('../models/Role');

class AttendanceService {
  async getAllAttendance(date) {
    const adminRole = await Role.findOne({ name: 'admin' });
    
    // 1. Get all employees (excluding admin)
    const employees = await User.find({ role: { $ne: adminRole?._id } })
      .select('name employeeId phoneNumber email timingSettings')
      .sort({ name: 1 });

    const employeeIds = employees.map(e => e._id);

    // 2. Get attendance records and schedules in parallel
    const [attendanceRecords, schedules] = await Promise.all([
      Attendance.find({ date, user: { $in: employeeIds } }).populate('user', 'name employeeId phoneNumber email'),
      Schedule.find({ date, user: { $in: employeeIds } })
    ]);

    // 3. Create maps for O(1) lookups
    const attendanceMap = new Map(attendanceRecords.map(a => [a.user?._id?.toString(), a]));
    const scheduleMap = new Map(schedules.map(s => [s.user?.toString(), s]));

    // 4. Combine data
    return employees.map(emp => {
      const empIdStr = emp._id.toString();
      const record = attendanceMap.get(empIdStr);
      const snapshot = scheduleMap.get(empIdStr);
      
      const scheduleSnapshot = {
        loginTime: snapshot?.loginTime || emp.timingSettings?.loginTime || '09:30',
        logoutTime: snapshot?.logoutTime || emp.timingSettings?.logoutTime || '18:30',
        graceTime: snapshot?.graceTime || emp.timingSettings?.graceTime || 15,
        lunchDuration: snapshot?.lunchDuration || emp.timingSettings?.lunchDuration || 45
      };

      if (record) {
        return { 
          ...record.toObject(), 
          schedule: scheduleSnapshot
        };
      }
      
      return {
        _id: `temp-${empIdStr}`,
        user: emp,
        date,
        schedule: scheduleSnapshot,
        checkIn: { time: '', mode: '', status: 'absent', permissionMinutes: 0 },
        checkOut: { time: '' },
        lunch: { out: '', in: '' },
        isHoliday: false,
        totalWorkingMinutes: 0
      };
    });
  }

  // Other methods can be moved here as well (checkIn, checkOut, etc.)
}

module.exports = new AttendanceService();
