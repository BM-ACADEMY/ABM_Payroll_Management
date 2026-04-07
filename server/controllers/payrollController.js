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
const { getISTDate, getISTTime, getISTFullDate } = require('../utils/dateUtils');

// @desc    Get monthly payroll report for all employees (Admin)
// @route   GET /api/payroll/report
exports.getMonthlyReport = async (req, res) => {
  const { startDate, endDate, page = 1, limit = 5 } = req.query; // e.g. 2026-03-01
  
  try {
    const actualStart = new Date(`${startDate}T00:00:00+05:30`);
    const actualEnd = new Date(`${endDate || startDate}T23:59:59+05:30`);

    const daysInMonthCount = getDaysInMonth(actualStart);
    
    // 1. Get total employee count (excluding admin)
    const employeeRole = await Role.findOne({ name: 'employee' });
    const query = { role: employeeRole?._id };
    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // 2. Fetch subset of employees
    const employees = await User.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const globalSettings = await Settings.findOne() || new Settings();
    const companyLeaves = await CompanyLeave.find({
      date: { $gte: format(actualStart, 'yyyy-MM-dd'), $lte: format(actualEnd, 'yyyy-MM-dd') }
    });

    const todayStr = getISTDate();

    const report = await Promise.all(employees.map(async (employee) => {
      const attendanceRecords = await Attendance.find({
        user: employee._id,
        date: { $gte: format(actualStart, 'yyyy-MM-dd'), $lte: format(actualEnd, 'yyyy-MM-dd') }
      });

      const employeeRequests = await Request.find({
        user: employee._id,
        date: { $gte: format(actualStart, 'yyyy-MM-dd'), $lte: format(actualEnd, 'yyyy-MM-dd') }
      });

      const permissionRequests = employeeRequests.filter(r => 
        r.type === 'permission' && (r.status === 'approved' || r.status === 'rejected')
      );
      
      const approvedLeaves = employeeRequests.filter(req => req.type === 'leave' && req.status === 'approved');

      let totalLOPDays = 0;
      let usedCasualLeaves = 0;
      let paidDays = 0;
      let absentDays = 0;

      let totalAcceptedMinutes = 0;
      let totalRejectedMinutes = 0;

      const days = eachDayOfInterval({ start: actualStart, end: actualEnd });
      
      days.forEach(day => {
        const dateStr = getISTDate(day);
        if (dateStr > todayStr && actualEnd > getISTFullDate()) return;

        const attendance = attendanceRecords.find(a => a.date === dateStr);
        const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
        const isSun = isSunday(day);
        const isMon = isMonday(day);
        const isSat = isSaturday(day);

        let isPaid = false;

        if (isSun || isCoLeave) {
          isPaid = true;
        } else if (attendance && attendance.checkIn?.time) {
          isPaid = true;
          totalAcceptedMinutes += (attendance.checkIn.permissionMinutes || 0);
        } else {
          const leaveReq = approvedLeaves.find(l => l.date === dateStr);
          
          // SANDWICH RULE: Monday and Saturday are Double LOP (2 days) even with Casual Leave
          if (isMon || isSat) {
            totalLOPDays += 2;
          } else if (leaveReq) {
            // Regular weekday with approved leave
            if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
              usedCasualLeaves++;
              isPaid = true;
            } else {
              totalLOPDays += 1;
            }
          } else if (dateStr < todayStr) {
            // Unexcused absence
            absentDays++;
            totalLOPDays += 1;
          }
        }

        if (isPaid) paidDays++;
      });

      permissionRequests.forEach(p => {
        if (p.type === 'lunch_delay') {
          if (p.status === 'rejected') {
            totalAcceptedMinutes += (p.duration || 0);
          }
        } else if (p.type === 'permission') {
          if (p.status === 'approved') {
            totalAcceptedMinutes += (p.duration || 0);
          } else if (p.status === 'rejected') {
            totalRejectedMinutes += (p.duration || 0);
          }
        } else {
          totalAcceptedMinutes += (p.duration || 0);
        }
      });

      const totalAcceptedHours = totalAcceptedMinutes / 60;
      const totalRejectedHours = totalRejectedMinutes / 60;
      
      let permissionLopDays = 0;
      if (totalAcceptedHours > 5) {
        permissionLopDays += 1.0;
      } else if (totalAcceptedHours > 3) {
        permissionLopDays += 0.5;
      }

      if (totalRejectedHours > 0) {
        if (totalRejectedHours < 3) {
          permissionLopDays += 0.5;
        } else {
          permissionLopDays += 1.0;
        }
      }
      
      totalLOPDays += permissionLopDays;

      const calcBaseDays = globalSettings.monthlyWorkingDays || daysInMonthCount;
      const dailyRate = (employee.baseSalary || 0) / calcBaseDays;
      const netSalary = dailyRate * Math.max(0, (paidDays - (totalLOPDays - absentDays) - permissionLopDays));
      // Explanation: paidDays already subtracted the day of absence. 
      // totalLOPDays includes the extra penalty day for sandwich rule.
      // So we subtract (totalLOPDays - absentDays) from paidDays.
      // Wait, let's simplify:
      const actualDeductedDays = totalLOPDays + permissionLopDays;
      const finalNetSalary = dailyRate * Math.max(0, (calcBaseDays - actualDeductedDays));

      return {
        _id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        baseSalary: employee.baseSalary || 0,
        presentDays: paidDays,
        absentDays,
        totalLOPDays,
        netSalary: Math.round(finalNetSalary * 100) / 100
      };
    }));

    res.json({
      report,
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current user's payroll summary
// @route   GET /api/payroll/my-summary
exports.getMySummary = async (req, res) => {
  const now = getISTFullDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  try {
    const startDate = startOfMonth(getISTFullDate(new Date(year, month - 1)));
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

    const employeeRequests = await Request.find({
      user: req.user.id,
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });

    const permissionRequests = employeeRequests.filter(r => 
      r.type === 'permission' && (r.status === 'approved' || r.status === 'rejected')
    );
    
    const lunchDelayRequests = employeeRequests.filter(r => r.type === 'lunch_delay');

    const approvedLeaves = employeeRequests.filter(req => req.type === 'leave' && req.status === 'approved');


    let totalAcceptedMinutes = 0;
    let totalRejectedMinutes = 0;
    let paidDays = 0;
    let totalLOPDays = 0;
    let usedCasualLeaves = 0;
    const todayStr = getISTDate();

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      const dateStr = getISTDate(day);
      if (dateStr > todayStr) return; // Only count up to today

      const attendance = attendanceRecords.find(a => a.date === dateStr);
      const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
      const isSun = isSunday(day);
      const isMon = isMonday(day);
      const isSat = isSaturday(day);

      let isPaid = false;

      if (isSun || isCoLeave) {
        isPaid = true;
      } else if (attendance && attendance.checkIn?.time) {
        isPaid = true;
        totalAcceptedMinutes += (attendance.checkIn.permissionMinutes || 0);
      } else {
        const leaveReq = approvedLeaves.find(l => l.date === dateStr);
        
        // SANDWICH RULE: Monday and Saturday are Double LOP (2 days) even with Casual Leave
        if (isMon || isSat) {
          totalLOPDays += 2;
        } else if (leaveReq) {
          if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
            usedCasualLeaves++;
            isPaid = true;
          } else {
            totalLOPDays += 1;
          }
        } else if (dateStr < todayStr) {
          // Unexcused absence strictly in the past
          totalLOPDays += 1;
        }
      }

      if (isPaid) paidDays++;
    });

    permissionRequests.forEach(p => {
      if (p.type === 'lunch_delay') {
        if (p.status === 'rejected') {
          totalAcceptedMinutes += (p.duration || 0);
        }
      } else if (p.type === 'permission') {
        if (p.status === 'approved') {
          totalAcceptedMinutes += (p.duration || 0);
        } else if (p.status === 'rejected') {
          totalRejectedMinutes += (p.duration || 0);
        }
      } else {
        totalAcceptedMinutes += (p.duration || 0);
      }
    });

    const totalAcceptedHours = totalAcceptedMinutes / 60;
    const totalRejectedHours = totalRejectedMinutes / 60;
    
    let permissionLopDays = 0;
    
    // Accepted Permission Rule: > 3h = 0.5, > 5h = 1.0
    if (totalAcceptedHours > 5) {
      permissionLopDays += 1.0;
    } else if (totalAcceptedHours > 3) {
      permissionLopDays += 0.5;
    }

    // Rejected Permission Rule: < 3h = 0.5, < 5h = 1.0
    if (totalRejectedHours > 0) {
      if (totalRejectedHours < 3) {
        permissionLopDays += 0.5;
      } else {
        permissionLopDays += 1.0;
      }
    }
    
    const actualDeductedDays = totalLOPDays + permissionLopDays;
    const calcBaseDays = globalSettings.monthlyWorkingDays || daysInMonthCount;
    const dailyRate = employee.baseSalary / calcBaseDays;
    const finalNetSalary = dailyRate * Math.max(0, (calcBaseDays - actualDeductedDays));

    res.json({
      baseSalary: employee.baseSalary,
      presentDays: paidDays,
      totalPermissionHours: totalAcceptedHours.toFixed(2), // Fixed variable name from totalPermissionHours to totalAcceptedHours
      totalLOPDays,
      estimatedNetSalary: Math.round(finalNetSalary * 100) / 100
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
    const start = new Date(`${startDate}T00:00:00+05:30`);
    const end = new Date(`${endDate}T23:59:59+05:30`);

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

    const employeeRequests = await Request.find({
      user: employee._id,
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }
    });

    const permissionRequests = employeeRequests.filter(r => 
      r.type === 'permission' && (r.status === 'approved' || r.status === 'rejected')
    );
    
    const lunchDelayRequests = employeeRequests.filter(r => r.type === 'lunch_delay');

    const approvedLeaves = employeeRequests.filter(req => req.type === 'leave' && req.status === 'approved');


    let totalAcceptedMinutes = 0;
    let totalRejectedMinutes = 0;
    let paidDays = 0;
    let absentDays = 0;
    let totalLOPDays = 0;
    let singleLopDays = 0;
    let usedCasualLeaves = 0;
    let casualLeaveTaken = 0;
    const todayStr = getISTDate();

    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const dateStr = getISTDate(day);
      if (dateStr > todayStr && end > getISTFullDate()) return;
      
      const attendance = attendanceRecords.find(a => a.date === dateStr);
      const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
      const isSun = isSunday(day);
      const isMon = isMonday(day);
      const isSat = isSaturday(day);

      let isPaid = false;

      if (isSun || isCoLeave) {
        isPaid = true;
      } else if (attendance && attendance.checkIn?.time) {
        isPaid = true;
        totalAcceptedMinutes += (attendance.checkIn.permissionMinutes || 0);
      } else {
        const leaveReq = approvedLeaves.find(l => l.date === dateStr);
        
        // SANDWICH RULE: Monday and Saturday are Double LOP (2 days) even with Casual Leave
        if (isMon || isSat) {
          totalLOPDays += 2;
          singleLopDays += 2; // Penalty count
        } else if (leaveReq) {
          if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
            usedCasualLeaves++;
            casualLeaveTaken++;
            isPaid = true;
          } else {
            singleLopDays++;
            totalLOPDays += 1;
          }
        } else {
          if (dateStr < todayStr) {
             absentDays++;
             totalLOPDays += 1;
             singleLopDays++;
          }
        }
      }

      if (isPaid) paidDays++;
    });

    permissionRequests.forEach(p => {
      if (p.type === 'lunch_delay') {
        if (p.status === 'rejected') {
          totalAcceptedMinutes += (p.duration || 0);
        }
      } else if (p.type === 'permission') {
        if (p.status === 'approved') {
          totalAcceptedMinutes += (p.duration || 0);
        } else if (p.status === 'rejected') {
          totalRejectedMinutes += (p.duration || 0);
        }
      } else {
        totalAcceptedMinutes += (p.duration || 0);
      }
    });

    const totalAcceptedHours = totalAcceptedMinutes / 60;
    const totalRejectedHours = totalRejectedMinutes / 60;
    
    let permissionLopDays = 0;
    
    // Accepted Permission Rule: > 3h = 0.5, > 5h = 1.0
    if (totalAcceptedHours > 5) {
      permissionLopDays += 1.0;
    } else if (totalAcceptedHours > 3) {
      permissionLopDays += 0.5;
    }

    // Rejected Permission Rule: < 3h = 0.5, < 5h = 1.0
    if (totalRejectedHours > 0) {
      if (totalRejectedHours < 3) {
        permissionLopDays += 0.5;
      } else {
        permissionLopDays += 1.0;
      }
    }
    
    const actualDeductedDays = totalLOPDays + permissionLopDays;
    const calcBaseDays = globalSettings.monthlyWorkingDays || daysInMonthCount;
    const currentDailyRate = (employee.baseSalary || 0) / calcBaseDays;
    const finalNetSalary = currentDailyRate * Math.max(0, (calcBaseDays - actualDeductedDays));




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
        presentDays: paidDays,
        singleLopDays,
        casualLeaveTaken,
        totalAbsentDays: absentDays,
        totalPermissionHours: totalAcceptedHours.toFixed(2), // Fixed variable name
        baseSalary: employee.baseSalary || 0,
        perDaySalary: Math.round(currentDailyRate * 100) / 100,
        totalLopDaysGenerated: totalLOPDays,
        netSalary: Math.round(finalNetSalary * 100) / 100
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

