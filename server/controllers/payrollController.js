const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Request = require('../models/Request');
const Settings = require('../models/Settings');
const CompanyLeave = require('../models/CompanyLeave');
const { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSunday, 
  isSaturday, 
  isMonday,
  getDaysInMonth
} = require('date-fns');

// @desc    Get monthly payroll report for all employees (Admin)
// @route   GET /api/payroll/report
exports.getMonthlyReport = async (req, res) => {
  const { startDate, endDate } = req.query; // e.g. 2026-03-01
  
  try {
    const start = startOfMonth(new Date(startDate));
    const end = endOfMonth(new Date(endDate || startDate));
    
    // If exact dates are provided (not just month-based), use them
    const actualStart = new Date(startDate);
    const actualEnd = new Date(endDate || startDate);
    actualEnd.setHours(23, 59, 59, 999);

    const daysInRangeCount = Math.ceil((actualEnd - actualStart) / (1000 * 60 * 60 * 24));
    const daysInMonthCount = getDaysInMonth(actualStart);
    
    // Fetch all employees
    const employees = await User.find({ role: { $ne: null } });
    const globalSettings = await Settings.findOne() || new Settings();
    const companyLeaves = await CompanyLeave.find({
      date: { $gte: format(actualStart, 'yyyy-MM-dd'), $lte: format(actualEnd, 'yyyy-MM-dd') }
    });

    const report = await Promise.all(employees.map(async (employee) => {
      const attendanceRecords = await Attendance.find({
        user: employee._id,
        date: { $gte: format(actualStart, 'yyyy-MM-dd'), $lte: format(actualEnd, 'yyyy-MM-dd') }
      });

      const approvedPermissions = await Request.find({
        user: employee._id,
        type: 'permission',
        status: 'approved',
        date: { $gte: format(actualStart, 'yyyy-MM-dd'), $lte: format(actualEnd, 'yyyy-MM-dd') }
      });

      const approvedLeaves = await Request.find({
        user: employee._id,
        type: 'leave',
        status: 'approved',
        date: { $gte: format(actualStart, 'yyyy-MM-dd'), $lte: format(actualEnd, 'yyyy-MM-dd') }
      });

      let totalLOPDays = 0;
      let usedCasualLeaves = 0;
      let totalPermissionMinutes = 0;
      let presentDays = 0;
      let absentDays = 0;

      const days = eachDayOfInterval({ start: actualStart, end: actualEnd });
      
      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const attendance = attendanceRecords.find(a => a.date === dateStr);
        const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
        const isSun = isSunday(day);
        const isMon = isMonday(day);
        const isSat = isSaturday(day);

        if (isSun || isCoLeave) {
          presentDays++;
          return;
        }

        if (attendance && attendance.checkIn?.time) {
          presentDays++;
          totalPermissionMinutes += (attendance.checkIn.permissionMinutes || 0);
        } else {
          const leaveReq = approvedLeaves.find(l => l.date === dateStr);
          if (leaveReq) {
            if (isMon || isSat) {
              totalLOPDays += 2;
            } else {
              if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
                usedCasualLeaves++;
              } else {
                totalLOPDays += 1;
              }
            }
          } else {
            absentDays++;
            if (isMon || isSat) {
              totalLOPDays += 2;
            } else {
              totalLOPDays += 1;
            }
          }
        }
      });

      approvedPermissions.forEach(p => {
        totalPermissionMinutes += (p.duration || 0);
      });

      const totalPermissionHours = totalPermissionMinutes / 60;
      if (totalPermissionHours > globalSettings.permissionTier2Limit) {
        totalLOPDays += globalSettings.permissionTier2Deduction;
      } else if (totalPermissionHours > globalSettings.permissionTier1Limit) {
        totalLOPDays += globalSettings.permissionTier1Deduction;
      }

      const dailyRate = (employee.baseSalary || 0) / daysInMonthCount;
      const netSalary = dailyRate * Math.max(0, (daysInRangeCount - totalLOPDays));

      return {
        _id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        baseSalary: employee.baseSalary || 0,
        presentDays,
        absentDays,
        totalPermissionHours: totalPermissionHours.toFixed(2),
        totalLOPDays,
        netSalary: Math.round(netSalary * 100) / 100
      };
    }));

    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current user's payroll summary
// @route   GET /api/payroll/my-summary
exports.getMySummary = async (req, res) => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  
  try {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);
    const daysInMonthCount = getDaysInMonth(startDate);
    
    const employee = await User.findById(req.user.id);
    const globalSettings = await Settings.findOne() || new Settings();
    const companyLeaves = await CompanyLeave.find({
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });

    const attendanceRecords = await Attendance.find({
      user: req.user.id,
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });

    const approvedPermissions = await Request.find({
      user: req.user.id,
      type: 'permission',
      status: 'approved',
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });

    const approvedLeaves = await Request.find({
      user: req.user.id,
      type: 'leave',
      status: 'approved',
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });

    let totalLOPDays = 0;
    let usedCasualLeaves = 0;
    let totalPermissionMinutes = 0;
    let presentDays = 0;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const attendance = attendanceRecords.find(a => a.date === dateStr);
      const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
      const isSun = isSunday(day);

      if (isSun || isCoLeave) {
        presentDays++;
        return;
      }

      if (attendance && attendance.checkIn?.time) {
        presentDays++;
        totalPermissionMinutes += (attendance.checkIn.permissionMinutes || 0);
      } else {
        const leaveReq = approvedLeaves.find(l => l.date === dateStr);
        if (leaveReq) {
          if (isMonday(day) || isSaturday(day)) {
            totalLOPDays += 2;
          } else {
            if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
              usedCasualLeaves++;
            } else {
              totalLOPDays += 1;
            }
          }
        } else if (new Date(dateStr) < new Date()) {
          // Apply casual leave to raw/unapproved absences as well
          if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
            usedCasualLeaves++;
          } else {
            if (isMonday(day) || isSaturday(day)) {
              totalLOPDays += 2;
            } else {
              totalLOPDays += 1;
            }
          }
        }
      }
    });

    approvedPermissions.forEach(p => {
      totalPermissionMinutes += (p.duration || 0);
    });

    const totalPermissionHours = totalPermissionMinutes / 60;
    if (totalPermissionHours > globalSettings.permissionTier2Limit) {
      totalLOPDays += globalSettings.permissionTier2Deduction;
    } else if (totalPermissionHours > globalSettings.permissionTier1Limit) {
      totalLOPDays += globalSettings.permissionTier1Deduction;
    }

    const dailyRate = employee.baseSalary / daysInMonthCount;
    const netSalary = dailyRate * Math.max(0, (daysInMonthCount - totalLOPDays));

    res.json({
      baseSalary: employee.baseSalary,
      presentDays,
      totalPermissionHours: totalPermissionHours.toFixed(2),
      totalLOPDays,
      estimatedNetSalary: Math.round(netSalary * 100) / 100
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Generate individual salary report
// @route   GET /api/payroll/generate/:employeeId
exports.generateIndividualSalary = async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query; // Format: yyyy-mm-dd
  
  if (!startDate || !endDate) {
    return res.status(400).json({ msg: 'Please provide both start and end dates' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
       return res.status(400).json({ msg: 'Start date cannot be after end date' });
    }

    let query = { employeeId: employeeId };
    if (employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        query = { $or: [{ _id: employeeId }, { employeeId: employeeId }]};
    }

    const employee = await User.findOne(query);

    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const daysInRangeCount = Math.ceil((end - start + 1) / (1000 * 60 * 60 * 24));
    
    const daysInMonthCount = getDaysInMonth(start);
    const dailyRate = (employee.baseSalary || 0) / daysInMonthCount;

    const globalSettings = await Settings.findOne() || new Settings();
    const companyLeaves = await CompanyLeave.find({
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }
    });

    const attendanceRecords = await Attendance.find({
      user: employee._id,
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }
    });

    const approvedPermissions = await Request.find({
      user: employee._id,
      type: 'permission',
      status: 'approved',
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }
    });

    const approvedLeaves = await Request.find({
      user: employee._id,
      type: 'leave',
      status: 'approved',
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }
    });

    let totalLOPDays = 0;
    let singleLopDays = 0;
    let usedCasualLeaves = 0;
    let casualLeaveTaken = 0;
    let totalPermissionMinutes = 0;
    let presentDays = 0;
    let absentDays = 0;

    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const attendance = attendanceRecords.find(a => a.date === dateStr);
      const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
      const isSun = isSunday(day);

      if (isSun || isCoLeave) {
        presentDays++;
        return;
      }

      if (attendance && attendance.checkIn?.time) {
        presentDays++;
        totalPermissionMinutes += (attendance.checkIn.permissionMinutes || 0);
      } else {
        const leaveReq = approvedLeaves.find(l => l.date === dateStr);
        if (leaveReq) {
          if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
            usedCasualLeaves++;
            casualLeaveTaken++;
          } else {
            singleLopDays++;
            totalLOPDays += 1;
          }
        } else {
          if (new Date(dateStr) < new Date()) {
             absentDays++;
             if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
               usedCasualLeaves++;
               casualLeaveTaken++;
             } else {
               singleLopDays++;
               totalLOPDays += 1;
             }
          }
        }
      }
    });

    approvedPermissions.forEach(p => {
      totalPermissionMinutes += (p.duration || 0);
    });

    const totalPermissionHours = totalPermissionMinutes / 60;
    if (totalPermissionHours > globalSettings.permissionTier2Limit) {
      totalLOPDays += globalSettings.permissionTier2Deduction;
    } else if (totalPermissionHours > globalSettings.permissionTier1Limit) {
      totalLOPDays += globalSettings.permissionTier1Deduction;
    }

    const netSalary = dailyRate * Math.max(0, (daysInRangeCount - totalLOPDays));

    res.json({
      employee: {
        _id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        department: employee.department
      },
      salaryDetails: {
        totalDays: daysInRangeCount,
        presentDays,
        singleLopDays,
        casualLeaveTaken,
        totalAbsentDays: absentDays,
        totalPermissionHours: totalPermissionHours.toFixed(2),
        baseSalary: employee.baseSalary || 0,
        perDaySalary: Math.round(dailyRate * 100) / 100,
        totalLopDaysGenerated: totalLOPDays,
        netSalary: Math.round(netSalary * 100) / 100
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

