const TimeLog = require('../models/TimeLog');
const Settings = require('../models/Settings');
const User = require('../models/User');
const Task = require('../models/Task');
const { processMentions } = require('../utils/mentionHelper');
const emailService = require('../services/emailService');

exports.startTimeTracking = async (req, res) => {
  const { taskName } = req.body;
  try {
    // Multiple tasks are allowed simultaneously

    const newTimeLog = new TimeLog({
      user: req.user.id,
      taskName,
      startTime: new Date(),
      status: 'running',
      activityLog: [{
        type: 'play',
        startTime: new Date()
      }]
    });

    const timeLog = await newTimeLog.save();
    
    // Live tracking update
    req.io.emit('time_log_updated', timeLog);
    
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createPausedLog = async (req, res) => {
  const { taskName, originChecklistItemId } = req.body;
  try {
    const now = new Date();
    const newTimeLog = new TimeLog({
      user: req.user.id,
      taskName,
      startTime: now,
      status: 'paused',
      label: 'not yet started',
      originChecklistItemId: originChecklistItemId || null,
      pauses: [{
        pauseStart: now,
        label: 'not yet started'
      }],
      activityLog: [{
        type: 'play',
        startTime: now,
        endTime: now,
        duration: 0
      }, {
        type: 'pause',
        startTime: now,
        label: 'not yet started'
      }]
    });

    const timeLog = await newTimeLog.save();
    
    // Sync back to Kanban if it's from a checklist item
    if (originChecklistItemId) {
      try {
        const kanbanTask = await Task.findOne({ "checklists.items._id": originChecklistItemId });
        if (kanbanTask) {
          kanbanTask.checklists.forEach(cl => {
            const item = cl.items.id(originChecklistItemId);
            if (item) {
              item.timeLogLabel = 'not yet started';
            }
          });
          await kanbanTask.save();
          if (req.io) req.io.emit('task_updated', kanbanTask);
        }
      } catch (syncErr) {
        console.error('Sync Error in createPausedLog:', syncErr.message);
      }
    }

    if (req.io) req.io.emit('time_log_updated', timeLog);
    
    res.json(timeLog);
  } catch (err) {
    console.error('Create Paused Log Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.pauseTimeTracking = async (req, res) => {
  try {
    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });
    if (timeLog.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    if (timeLog.status !== 'running') return res.status(400).json({ msg: 'Task is not running' });

    const { label, message } = req.body;
    timeLog.status = 'paused';
    timeLog.label = label || timeLog.label;
    
    if (message) {
      const currentUser = await User.findById(req.user.id);
      timeLog.comments.push({
        text: message,
        author: currentUser.name,
        createdAt: new Date()
      });
    }

    const now = new Date();
    timeLog.pauses.push({ 
      pauseStart: now,
      label: label || timeLog.label
    });

    // Handle activityLog: Close 'play', Start 'pause'
    const lastActivity = timeLog.activityLog[timeLog.activityLog.length - 1];
    if (lastActivity && lastActivity.type === 'play' && !lastActivity.endTime) {
      lastActivity.endTime = now;
      lastActivity.duration = Math.floor((now - new Date(lastActivity.startTime)) / 1000);
    }

    // Calculate intermediate duration
    const startTime = new Date(timeLog.startTime);
    let totalPauseDuration = 0;
    timeLog.pauses.forEach(p => {
      if (p.pauseEnd) {
        totalPauseDuration += (new Date(p.pauseEnd) - new Date(p.pauseStart));
      }
    });
    
    // Duration in seconds
    timeLog.duration = Math.floor((now - startTime - totalPauseDuration) / 1000);

    await timeLog.save();
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.resumeTimeTracking = async (req, res) => {
  try {
    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });
    if (timeLog.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    if (!['paused', 'pending'].includes(timeLog.status)) {
       return res.status(400).json({ msg: 'Task cannot be started' });
    }

    const wasPending = timeLog.status === 'pending';
    const now = new Date();
    timeLog.status = 'running';
    
    if (wasPending) {
       timeLog.startTime = now;
    } else {
       const lastPause = timeLog.pauses[timeLog.pauses.length - 1];
       if (lastPause && !lastPause.pauseEnd) {
         lastPause.pauseEnd = now;
       }
    }

    // Handle activityLog: Start new 'play' session
    timeLog.activityLog.push({
      type: 'play',
      startTime: now
    });

    await timeLog.save();
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.stopTimeTracking = async (req, res) => {
  try {
    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });
    if (timeLog.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    const { label, message } = req.body;
    const now = new Date();
    timeLog.endTime = now;
    timeLog.status = 'completed';
    if (label) timeLog.label = label;
    
    if (message) {
      const currentUser = await User.findById(req.user.id);
      timeLog.comments.push({
        text: message,
        author: currentUser.name,
        createdAt: now
      });
    }

    // Handle open pause if any
    const lastPause = timeLog.pauses[timeLog.pauses.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = now;
      if (label) lastPause.label = label;
    }

    // Handle activityLog: Close last entry
    const lastActivity = timeLog.activityLog[timeLog.activityLog.length - 1];
    if (lastActivity && !lastActivity.endTime) {
      lastActivity.endTime = now;
      lastActivity.duration = Math.floor((now - new Date(lastActivity.startTime)) / 1000);
    }

    // Calculate final duration
    const startTime = new Date(timeLog.startTime);
    let totalPauseDuration = 0;
    timeLog.pauses.forEach(p => {
      if (p.pauseEnd) {
        totalPauseDuration += (new Date(p.pauseEnd) - new Date(p.pauseStart));
      }
    });
    
    timeLog.duration = Math.floor((now - startTime - totalPauseDuration) / 1000);

    await timeLog.save();

    // Sync with Kanban if it originated from a task or checklist item
    if (timeLog.originChecklistItemId || timeLog.originTaskId) {
      try {
        let kanbanTask;
        if (timeLog.originChecklistItemId) {
          kanbanTask = await Task.findOne({ "checklists.items._id": timeLog.originChecklistItemId });
        } else {
          kanbanTask = await Task.findById(timeLog.originTaskId);
        }

        if (kanbanTask) {
          if (timeLog.originChecklistItemId) {
            kanbanTask.checklists.forEach(checklist => {
              const item = checklist.items.id(timeLog.originChecklistItemId);
              if (item) {
                if (label) item.timeLogLabel = label;
                if (label === 'done') item.isCompleted = true;
              }
            });
          } else {
            if (label) kanbanTask.timeLogLabel = label;
            if (label === 'done') kanbanTask.isCompleted = true;
          }
          await kanbanTask.save();
          if (req.io) req.io.emit('task_updated', kanbanTask);
        }
      } catch (syncErr) {
        console.error('Failed to sync with Kanban on stop:', syncErr);
      }
    }
    
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.restartTimeTracking = async (req, res) => {
  try {
    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });
    if (timeLog.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    if (timeLog.status === 'completed') {
        const now = new Date();
        timeLog.status = 'paused';
        timeLog.endTime = null;
        
        timeLog.pauses.push({
            pauseStart: now,
            label: timeLog.label || 'in process'
        });

        timeLog.activityLog.push({
            type: 'pause',
            startTime: now,
            label: timeLog.label || 'in process'
        });

        await timeLog.save();
    }

    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Comment text is required' });

    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });
    
    // Authorization check
    if (timeLog.user.toString() !== req.user.id) {
        const isAdmin = req.user.role === 'admin'; // Assuming role is available or check user
        if (!isAdmin) return res.status(401).json({ msg: 'Not authorized' });
    }

    const currentUser = await User.findById(req.user.id);
    
    // Parse mentions and notify
    const mentions = await processMentions(text, currentUser, {
      title: timeLog.taskName,
      taskId: timeLog._id, // Context ID
      boardName: 'Task Tracker'
    }, req.io);

    timeLog.comments.push({
      text,
      author: currentUser.name,
      mentions,
      createdAt: new Date()
    });

    await timeLog.save();
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { label } = req.body;
    if (!label) return res.status(400).json({ msg: 'Label is required' });

    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });

    if (timeLog.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    timeLog.label = label;
    await timeLog.save();

    // Sync with Kanban if it originated from a task or checklist item
    if (timeLog.originChecklistItemId || timeLog.originTaskId) {
      try {
        let kanbanTask;
        if (timeLog.originChecklistItemId) {
          kanbanTask = await Task.findOne({ "checklists.items._id": timeLog.originChecklistItemId });
        } else {
          kanbanTask = await Task.findById(timeLog.originTaskId);
        }

        if (kanbanTask) {
          if (timeLog.originChecklistItemId) {
            kanbanTask.checklists.forEach(checklist => {
              const item = checklist.items.id(timeLog.originChecklistItemId);
              if (item) {
                item.timeLogLabel = label;
                if (label === 'done') item.isCompleted = true;
              }
            });
          } else {
            kanbanTask.timeLogLabel = label;
            if (label === 'done') kanbanTask.isCompleted = true;
          }
          await kanbanTask.save();
          if (req.io) req.io.emit('task_updated', kanbanTask);
        }
      } catch (syncErr) {
        console.error('Failed to sync with Kanban status:', syncErr);
      }
    }
    
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Comment text is required' });

    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });

    const commentIndex = timeLog.comments.findIndex(c => c._id.toString() === req.params.commentId);
    if (commentIndex === -1) return res.status(404).json({ msg: 'Comment not found' });

    const currentUser = await User.findById(req.user.id);
    const mentions = await processMentions(text, currentUser, {
      title: timeLog.taskName,
      taskId: timeLog._id,
      boardName: 'Task Tracker'
    }, req.io);

    timeLog.comments[commentIndex].text = text;
    timeLog.comments[commentIndex].mentions = mentions;
    timeLog.comments[commentIndex].updatedAt = new Date();

    await timeLog.save();
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteComment = async (req, res) => {
  try {
    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });

    const commentIndex = timeLog.comments.findIndex(c => c._id.toString() === req.params.commentId);
    if (commentIndex === -1) return res.status(404).json({ msg: 'Comment not found' });

    const currentUser = await User.findById(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    if (timeLog.comments[commentIndex].author !== currentUser.name && !isAdmin) {
        return res.status(401).json({ msg: 'Not authorized' });
    }

    timeLog.comments.splice(commentIndex, 1);
    await timeLog.save();
    
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTimeLogs = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 5, taskName } = req.query;
    let query = { user: req.user.id };

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00+05:30`);
      const end = new Date(`${endDate}T23:59:59+05:30`);
      query.$or = [
        { startTime: { $gte: start, $lte: end } },
        { 
          status: 'pending',
          createdAt: { $gte: start, $lte: end }
        }
      ];
    }

    if (taskName) {
      query.taskName = { $regex: taskName, $options: 'i' };
    }

    const totalCount = await TimeLog.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    const logs = await TimeLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      logs,
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getActiveTimeLogs = async (req, res) => {
  try {
    const logs = await TimeLog.find({ 
      user: req.user.id, 
      status: { $in: ['pending', 'running', 'paused'] } 
    }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAllTimeLogs = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 5, userName, taskName } = req.query;
    let query = {};

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00+05:30`);
      const end = new Date(`${endDate}T23:59:59+05:30`);
      query.$or = [
        { startTime: { $gte: start, $lte: end } },
        { 
          status: 'pending',
          createdAt: { $gte: start, $lte: end }
        }
      ];
    }

    if (userName) {
      const users = await User.find({ name: { $regex: userName, $options: 'i' } });
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    if (taskName) {
      query.taskName = { $regex: taskName, $options: 'i' };
    }

    const totalCount = await TimeLog.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    const logs = await TimeLog.find(query)
      .populate('user', 'name employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      logs,
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteTimeLog = async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });
    if (timeLog.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    if (timeLog.originChecklistItemId) {
      try {
        const kanbanTask = await Task.findOne({ "checklists.items._id": timeLog.originChecklistItemId });
        if (kanbanTask) {
          kanbanTask.checklists.forEach(cl => {
            const item = cl.items.id(timeLog.originChecklistItemId);
            if (item) item.timeLogLabel = '';
          });
          await kanbanTask.save();
          if (req.io) req.io.emit('task_updated', kanbanTask);
        }
      } catch (syncErr) { console.error(syncErr); }
    } else if (timeLog.originTaskId) {
      try {
        const task = await Task.findById(timeLog.originTaskId);
        if (task) {
          task.timeLogLabel = '';
          await task.save();
          if (req.io) req.io.emit('task_updated', task);
        }
      } catch (syncErr) { console.error(syncErr); }
    }
    await TimeLog.findByIdAndDelete(req.params.id);
    if (req.io) req.io.emit('time_log_deleted', req.params.id);
    res.json({ msg: 'Time log removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
