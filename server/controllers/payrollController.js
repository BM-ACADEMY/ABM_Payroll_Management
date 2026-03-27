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

    const todayStr = format(new Date(), 'yyyy-MM-dd');

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
      
      const lunchDelayRequests = employeeRequests.filter(r => r.type === 'lunch_delay');

      const approvedLeaves = employeeRequests.filter(req => req.type === 'leave' && req.status === 'approved');

      let totalLOPDays = 0;
      let usedCasualLeaves = 0;
      let totalPermissionMinutes = 0;
      let paidDays = 0;
      let absentDays = 0;

      const days = eachDayOfInterval({ start: actualStart, end: actualEnd });
      
      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        if (dateStr > todayStr && actualEnd > new Date()) return;

        const attendance = attendanceRecords.find(a => a.date === dateStr);
        const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
        const isSun = isSunday(day);
        const isMon = isMonday(day);
        const isSat = isSaturday(day);

        // A day is "paid" if it's a holiday, worked, or has approved leave
        let isPaid = false;

        if (isSun || isCoLeave) {
          isPaid = true;
        } else if (attendance && attendance.checkIn?.time) {
          isPaid = true;
          let dayPermissionMinutes = (attendance.checkIn.permissionMinutes || 0);

          const lunchReq = lunchDelayRequests.find(r => r.date === dateStr && r.status === 'approved');
          if (lunchReq) {
            dayPermissionMinutes = Math.max(0, dayPermissionMinutes - (lunchReq.duration || 0));
          }
          
          totalPermissionMinutes += dayPermissionMinutes;
        } else {
          const leaveReq = approvedLeaves.find(l => l.date === dateStr);
          if (leaveReq) {
            if (isMon || isSat) {
              totalLOPDays += 2;
            } else {
              if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
                usedCasualLeaves++;
                isPaid = true;
              } else {
                totalLOPDays += 1;
              }
            }
          } else if (dateStr < todayStr) {
            absentDays++;
            if (isMon || isSat) {
              totalLOPDays += 2;
            } else {
              totalLOPDays += 1;
            }
          }
        }

        if (isPaid) paidDays++;
      });

      permissionRequests.forEach(p => {
        totalPermissionMinutes += (p.duration || 0);
      });

      const totalPermissionHours = totalPermissionMinutes / 60;
      let permissionLopDays = 0;
      if (totalPermissionHours > globalSettings.permissionTier2Limit) {
        permissionLopDays = globalSettings.permissionTier2Deduction;
      } else if (totalPermissionHours > globalSettings.permissionTier1Limit) {
        permissionLopDays = globalSettings.permissionTier1Deduction;
      }
      totalLOPDays += permissionLopDays;

      const dailyRate = (employee.baseSalary || 0) / daysInMonthCount;
      const netSalary = dailyRate * Math.max(0, (paidDays - permissionLopDays));

      return {
        _id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        baseSalary: employee.baseSalary || 0,
        presentDays: paidDays,
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

    const employeeRequests = await Request.find({
      user: req.user.id,
      date: { $gte: format(startDate, 'yyyy-MM-dd'), $lte: format(endDate, 'yyyy-MM-dd') }
    });

    const permissionRequests = employeeRequests.filter(r => 
      r.type === 'permission' && (r.status === 'approved' || r.status === 'rejected')
    );
    
    const lunchDelayRequests = employeeRequests.filter(r => r.type === 'lunch_delay');

    const approvedLeaves = employeeRequests.filter(req => req.type === 'leave' && req.status === 'approved');


    let totalLOPDays = 0;
    let usedCasualLeaves = 0;
    let totalPermissionMinutes = 0;
    let paidDays = 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (dateStr > todayStr) return; // Only count up to today

      const attendance = attendanceRecords.find(a => a.date === dateStr);
      const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
      const isSun = isSunday(day);

      let isPaid = false;

      if (isSun || isCoLeave) {
        isPaid = true;
      } else if (attendance && attendance.checkIn?.time) {
        isPaid = true;
        let dayPermissionMinutes = (attendance.checkIn.permissionMinutes || 0);

        // If a lunch delay was approved, subtract it from the day's total 
        const lunchReq = lunchDelayRequests.find(r => r.date === dateStr && r.status === 'approved');
        if (lunchReq) {
          dayPermissionMinutes = Math.max(0, dayPermissionMinutes - (lunchReq.duration || 0));
        }
        
        totalPermissionMinutes += dayPermissionMinutes;
      } else {
        const leaveReq = approvedLeaves.find(l => l.date === dateStr);
        if (leaveReq) {
          if (isMonday(day) || isSaturday(day)) {
            totalLOPDays += 2;
          } else {
            if (usedCasualLeaves < globalSettings.casualLeaveLimit) {
              usedCasualLeaves++;
              isPaid = true;
            } else {
              totalLOPDays += 1;
            }
          }
        } else if (dateStr < todayStr) {
          // Unexcused absence strictly in the past
          if (isMonday(day) || isSaturday(day)) {
            totalLOPDays += 2;
          } else {
            totalLOPDays += 1;
          }
        }
      }

      if (isPaid) paidDays++;
    });

    permissionRequests.forEach(p => {
      totalPermissionMinutes += (p.duration || 0);
    });

    const totalPermissionHours = totalPermissionMinutes / 60;
    let permissionLopDays = 0;
    if (totalPermissionHours > globalSettings.permissionTier2Limit) {
      permissionLopDays = globalSettings.permissionTier2Deduction;
    } else if (totalPermissionHours > globalSettings.permissionTier1Limit) {
      permissionLopDays = globalSettings.permissionTier1Deduction;
    }
    totalLOPDays += permissionLopDays;

    const dailyRate = employee.baseSalary / daysInMonthCount;
    const netSalary = dailyRate * Math.max(0, (paidDays - permissionLopDays));


    res.json({
      baseSalary: employee.baseSalary,
      presentDays: paidDays,
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

    const employeeRequests = await Request.find({
      user: employee._id,
      date: { $gte: format(start, 'yyyy-MM-dd'), $lte: format(end, 'yyyy-MM-dd') }
    });

    const permissionRequests = employeeRequests.filter(r => 
      r.type === 'permission' && (r.status === 'approved' || r.status === 'rejected')
    );
    
    const lunchDelayRequests = employeeRequests.filter(r => r.type === 'lunch_delay');

    const approvedLeaves = employeeRequests.filter(req => req.type === 'leave' && req.status === 'approved');


    let totalLOPDays = 0;
    let singleLopDays = 0;
    let usedCasualLeaves = 0;
    let casualLeaveTaken = 0;
    let totalPermissionMinutes = 0;
    let paidDays = 0;
    let absentDays = 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (dateStr > todayStr && end > new Date()) return;
      
      const attendance = attendanceRecords.find(a => a.date === dateStr);
      const isCoLeave = companyLeaves.find(cl => cl.date === dateStr);
      const isSun = isSunday(day);

      let isPaid = false;

      if (isSun || isCoLeave) {
        isPaid = true;
      } else if (attendance && attendance.checkIn?.time) {
        isPaid = true;
        let dayPermissionMinutes = (attendance.checkIn.permissionMinutes || 0);

        // If a lunch delay was approved, subtract it from the day's total 
        const lunchReq = lunchDelayRequests.find(r => r.date === dateStr && r.status === 'approved');
        if (lunchReq) {
          dayPermissionMinutes = Math.max(0, dayPermissionMinutes - (lunchReq.duration || 0));
        }
        
        totalPermissionMinutes += dayPermissionMinutes;
      } else {
        const leaveReq = approvedLeaves.find(l => l.date === dateStr);
        if (leaveReq) {
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
             if (isMonday(day) || isSaturday(day)) {
               totalLOPDays += 2;
             } else {
               totalLOPDays += 1;
             }
             singleLopDays++;
          }
        }
      }

      if (isPaid) paidDays++;
    });

    permissionRequests.forEach(p => {
      totalPermissionMinutes += (p.duration || 0);
    });

    const totalPermissionHours = totalPermissionMinutes / 60;
    let permissionLopDays = 0;
    if (totalPermissionHours > globalSettings.permissionTier2Limit) {
      permissionLopDays = globalSettings.permissionTier2Deduction;
    } else if (totalPermissionHours > globalSettings.permissionTier1Limit) {
      permissionLopDays = globalSettings.permissionTier1Deduction;
    }
    totalLOPDays += permissionLopDays;

    const netSalary = dailyRate * Math.max(0, (paidDays - permissionLopDays));




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

