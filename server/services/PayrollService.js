const { format, parseISO, getDay, differenceInMinutes, startOfMonth, endOfMonth, eachDayOfInterval } = require('date-fns');

const calculatePayroll = async (user, month, year, attendanceRecords) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const perDaySalary = user.baseSalary / daysInMonth;
  const perMinuteSalary = perDaySalary / (9 * 60); // Assuming 9 hour working day for rate calculation

  let totalLopDays = 0;
  let totalPermissionMinutes = 0;
  let casualLeavesUsed = 0;

  // Constants from policy
  const CASUAL_LEAVE_QUOTA = 1;
  const PERMISSION_THRESHOLD_HOURS = 3;
  
  attendanceRecords.forEach(record => {
    const date = parseISO(record.date);
    const dayOfWeek = getDay(date); // 0=Sun, 1=Mon, ..., 6=Sat
    const isMondayOrSaturday = dayOfWeek === 1 || dayOfWeek === 6;

    if (record.leaveStatus === 'leave') {
      if (!isMondayOrSaturday && casualLeavesUsed < CASUAL_LEAVE_QUOTA) {
        casualLeavesUsed++;
      } else {
        // Monday/Saturday leave or extra leave = Double Loss of Pay or Single LOP
        totalLopDays += isMondayOrSaturday ? 2 : 1;
      }
    } else if (record.checkIn && record.checkIn.permissionMinutes > 0) {
      totalPermissionMinutes += record.checkIn.permissionMinutes;
    }

    // Lunch delay considered as permission if rejected
    if (record.lunch && record.lunch.delayReason && !record.lunch.isDelayApproved) {
      // Assuming 15 mins chunks for lunch late as a default if not specified
      totalPermissionMinutes += 30; 
    }
  });

  // Permission deduction: > 3 hours = 0.5 day salary deduction
  if (totalPermissionMinutes > PERMISSION_THRESHOLD_HOURS * 60) {
    totalLopDays += 0.5;
  }

  const lopAmount = totalLopDays * perDaySalary;
  const finalSalary = user.baseSalary - lopAmount;

  return {
    baseSalary: user.baseSalary,
    perDaySalary,
    totalLopDays,
    totalPermissionMinutes,
    casualLeavesUsed,
    lopAmount,
    finalSalary: Math.max(0, finalSalary)
  };
};

module.exports = { calculatePayroll };
