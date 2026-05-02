const cron = require('node-cron');
const User = require('../models/User');
const pushService = require('./pushService');
const { format, addMinutes } = require('date-fns');
const Task = require('../models/Task');
const List = require('../models/List');

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
    
    // Recurring tasks scheduler - runs at midnight everyday
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[Scheduler] Running recurring tasks generator...');
            const now = new Date();
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const currentDayName = daysOfWeek[now.getDay()];
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Find all recurrent tasks that are in sprint
            const recurringTasks = await Task.find({
                isInSprint: true,
                'recurrence.type': { $in: ['daily', 'custom', 'weekly'] }
            });

            for (const task of recurringTasks) {
                let shouldCreate = false;

                // Avoid creating duplicates on the exact same day
                if (task.recurrence.lastGeneratedDate) {
                    const lastGen = new Date(task.recurrence.lastGeneratedDate);
                    if (lastGen >= startOfToday) continue; // Already generated for today
                }

                if (task.recurrence.type === 'daily') {
                    shouldCreate = true;
                } else if (task.recurrence.type === 'custom') {
                    if (task.recurrence.customDays && task.recurrence.customDays.includes(currentDayName)) {
                        shouldCreate = true;
                    }
                } else if (task.recurrence.type === 'weekly') {
                    if (task.recurrence.weeklyDay === currentDayName) {
                        shouldCreate = true;
                    }
                }

                if (shouldCreate) {
                    // Create a clone of the task in the backlog
                    const backlogList = await List.findOne({ board: task.board }).sort('position'); // Usually the first list is backlog
                    
                    const newTask = new Task({
                        title: task.title,
                        description: task.description,
                        list: backlogList ? backlogList._id : task.list,
                        board: task.board,
                        assignees: task.assignees,
                        priority: task.priority,
                        estimatedTime: task.estimatedTime,
                        labels: task.labels,
                        checklists: task.checklists.map(c => ({
                            name: c.name,
                            items: c.items.map(i => ({
                                text: i.text,
                                assignedTo: i.assignedTo,
                                estimatedDuration: i.estimatedDuration
                            }))
                        })),
                        isInSprint: false,
                        recurrence: {
                            type: 'none' // The new task itself is a one-off instance unless configured again
                        }
                    });

                    await newTask.save();
                    console.log(`[Scheduler] Generated recurring task clone in backlog: ${newTask.title}`);

                    // Update lastGeneratedDate
                    task.recurrence.lastGeneratedDate = new Date();
                    await task.save();
                }
            }

        } catch (err) {
            console.error('[Scheduler Recurring Error]:', err.message);
        }
    });

    console.log('Background PUSH Scheduler Initialized');
};

module.exports = { initScheduler };
