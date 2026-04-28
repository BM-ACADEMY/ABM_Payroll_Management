const cron = require('node-cron');
const User = require('../models/User');
const pushService = require('./pushService');
const { format, addMinutes } = require('date-fns');

/**
 * Initializes background scheduled tasks
 */
const initScheduler = () => {
    // Run every minute
    // Cron syntax: minute hour day-of-month month day-of-week
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 is Sunday
            
            // Skip reminders on Sundays
            if (dayOfWeek === 0) return;

            // Target time is 10 minutes from now
            // We adjust for the IST timezone (+5:30) if the server is in UTC
            // But usually, node's Date() follows system time.
            const targetTime = addMinutes(now, 10);
            const targetTimeStr = format(targetTime, 'HH:mm');
            
            // Search for users who have attendance events exactly 10 minutes from now
            const usersToNotify = await User.find({
                pushSubscriptions: { $exists: true, $not: { $size: 0 } },
                $or: [
                    { 'timingSettings.loginTime': targetTimeStr },
                    { 'timingSettings.logoutTime': targetTimeStr },
                    { 'timingSettings.lunchStart': targetTimeStr },
                    { 'timingSettings.lunchEnd': targetTimeStr }
                ]
            });
            
            if (usersToNotify.length === 0) return;

            console.log(`[Scheduler] Sending reminders to ${usersToNotify.length} users for ${targetTimeStr}`);

            const notifications = usersToNotify.map(async (user) => {
                const { timingSettings } = user;
                let title = '';
                let body = '';
                
                if (timingSettings.loginTime === targetTimeStr) {
                    title = 'Attendance: Login Soon';
                    body = `Reminder: Your shift starts at ${timingSettings.loginTime}. Please login within 10 minutes.`;
                } else if (timingSettings.logoutTime === targetTimeStr) {
                    title = 'Attendance: logout Soon';
                    body = `Your shift ends at ${timingSettings.logoutTime}. You have 10 minutes left.`;
                } else if (timingSettings.lunchStart === targetTimeStr) {
                    title = 'Attendance: Lunch Out';
                    body = `Lunch break starts at ${timingSettings.lunchStart} in 10 minutes.`;
                } else if (timingSettings.lunchEnd === targetTimeStr) {
                    title = 'Attendance: Lunch In';
                    body = `Lunch break ends at ${timingSettings.lunchEnd} in 10 minutes. Please prepare to resume.`;
                }
                
                if (title) {
                    return pushService.sendPushNotification(user._id, {
                        title,
                        body,
                        data: { url: '/dashboard' }
                    });
                }
            });

            await Promise.all(notifications);
        } catch (err) {
            console.error('[Scheduler Error]:', err.message);
        }
    });
    
    console.log('Background PUSH Scheduler Initialized');
};

module.exports = { initScheduler };
