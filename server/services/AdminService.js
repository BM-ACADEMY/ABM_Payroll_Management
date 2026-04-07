const User = require('../models/User');
const Role = require('../models/Role');
const Attendance = require('../models/Attendance');
const Request = require('../models/Request');
const { format } = require('date-fns');

class AdminService {
  async getDashboardStats() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const staffRoles = await Role.find({ name: { $in: ['employee', 'subadmin'] } });
    const staffRoleIds = staffRoles.map(r => r._id);

    if (staffRoleIds.length === 0) throw new Error('Staff roles (employee/subadmin) not found');

    const [totalEmployees, presentToday, pendingLeaves, pendingPermissions, onLeaveToday] = await Promise.all([
      User.countDocuments({ role: { $in: staffRoleIds } }),
      Attendance.countDocuments({ 
        date: todayStr,
        "checkIn.time": { $exists: true, $ne: '' } 
      }),
      Request.countDocuments({ 
        type: 'leave', 
        status: 'pending' 
      }),
      Request.countDocuments({ 
        type: { $in: ['permission', 'lunch_delay', 'late_login'] }, 
        status: 'pending' 
      }),
      Request.countDocuments({
        type: 'leave',
        status: 'approved',
        date: todayStr
      })
    ]);

    const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

    const stats = [
      { label: 'Total Employees', value: totalEmployees.toString(), icon: 'Users', color: 'text-black', bg: 'bg-[#d30614]/10' },
      { label: 'Present Today', value: presentToday.toString(), icon: 'CheckCircle2', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Pending Leaves', value: pendingLeaves.toString(), icon: 'AlertCircle', color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Pending Permissions', value: pendingPermissions.toString(), icon: 'Clock', color: 'text-blue-600', bg: 'bg-blue-50' }
    ];

    const chartData = [
      { name: 'Present', value: presentToday, color: '#10b981' }, 
      { name: 'Absent', value: absentToday, color: '#d30614' },   
      { name: 'On Leave', value: onLeaveToday, color: '#f59e0b' } 
    ];

    return {
      stats,
      chartData,
      totalEmployees,
      presentToday,
      absentToday,
      onLeaveToday,
      pendingLeaves,
      pendingPermissions
    };
  }
}

module.exports = new AdminService();
