const TimeLog = require('../models/TimeLog');
const Settings = require('../models/Settings');

exports.startTimeTracking = async (req, res) => {
  const { taskName } = req.body;
  try {
    // Multiple tasks are allowed simultaneously

    const newTimeLog = new TimeLog({
      user: req.user.id,
      taskName,
      startTime: new Date(),
      status: 'running'
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

exports.pauseTimeTracking = async (req, res) => {
  try {
    let timeLog = await TimeLog.findById(req.params.id);
    if (!timeLog) return res.status(404).json({ msg: 'Time log not found' });
    if (timeLog.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    if (timeLog.status !== 'running') return res.status(400).json({ msg: 'Task is not running' });

    timeLog.status = 'paused';
    timeLog.pauses.push({ pauseStart: new Date() });

    // Calculate intermediate duration
    const now = new Date();
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

    if (timeLog.status !== 'paused') return res.status(400).json({ msg: 'Task is not paused' });

    timeLog.status = 'running';
    const lastPause = timeLog.pauses[timeLog.pauses.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date();
    }

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

    const now = new Date();
    timeLog.endTime = now;
    timeLog.status = 'completed';

    // Handle open pause if any
    const lastPause = timeLog.pauses[timeLog.pauses.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = now;
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
    if (req.io) req.io.emit('time_log_updated', timeLog);
    res.json(timeLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTimeLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { user: req.user.id };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const logs = await TimeLog.find(query).sort({ startTime: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAllTimeLogs = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (name) {
      const User = require('../models/User');
      const users = await User.find({ name: { $regex: name, $options: 'i' } }).select('_id');
      query.user = { $in: users.map(u => u._id) };
    }

    const logs = await TimeLog.find(query)
      .populate('user', ['name', 'email', 'employeeId'])
      .sort({ startTime: -1 });
    res.json(logs);
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
