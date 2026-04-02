const Task = require('../models/Task');
const Board = require('../models/Board');
const User = require('../models/User');
const AnalyticsSource = require('../models/AnalyticsSource');
const axios = require('axios');

// Helper to convert column letters to indices (A=0, B=1, ...)
const colToIndex = (col) => {
  if (!col) return 0;
  const upper = col.toUpperCase().trim();
  let index = 0;
  for (let i = upper.length - 1; i >= 0; i--) {
    index += (upper.charCodeAt(i) - 64) * Math.pow(26, upper.length - 1 - i);
  }
  return index - 1;
};

// @desc    Get internal employee performance stats
// @route   GET /api/analytics/employee-performance
// @access  Private/Admin
exports.getPerformanceStats = async (req, res) => {
  try {
    const tasks = await Task.find({ isCompleted: true })
      .populate('assignees', 'name')
      .populate('board', 'type title');

    // Aggregate Stats
    const statsByUser = {};

    tasks.forEach(task => {
      task.assignees.forEach(user => {
        if (!statsByUser[user._id]) {
          statsByUser[user._id] = {
            name: user.name,
            totalCompleted: 0,
            onTime: 0,
            delayed: 0,
            dailyCompletions: 0
          };
        }

        statsByUser[user._id].totalCompleted++;

        // Deadline check
        if (task.deadline) {
          const completedAt = task.updatedAt;
          const deadline = new Date(task.deadline);
          if (completedAt <= deadline) {
            statsByUser[user._id].onTime++;
          } else {
            statsByUser[user._id].delayed++;
          }
        } else {
          // If no deadline, we'll assume on time for now
          statsByUser[user._id].onTime++;
        }

        // Daily board check
        if (task.board && task.board.type === 'daily') {
          statsByUser[user._id].dailyCompletions++;
        }
      });
    });

    res.json(Object.values(statsByUser));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get Google Sheet data
// @route   GET /api/analytics/data/:id
// @access  Private/Admin
exports.getSourceData = async (req, res) => {
  try {
    const source = await AnalyticsSource.findById(req.params.id);
    if (!source) return res.status(404).json({ msg: 'Source not found' });

    // Transform GS Link to CSV export link
    let csvUrl = source.url;
    if (csvUrl.includes('docs.google.com/spreadsheets')) {
      const parts = csvUrl.split('/');
      const idIndex = parts.indexOf('d') + 1;
      const sheetId = parts[idIndex];
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    const response = await axios.get(csvUrl);
    const csvData = response.data;

    // Simple CSV parser (assuming comma separated)
    const lines = csvData.split('\n').map(line => line.split(','));
    if (lines.length < 2) return res.json({ labels: [], handlers: [], data: [] });

    const statusIdx = colToIndex(source.statusCol);
    const handlerIdx = colToIndex(source.handlerCol);

    const aggregates = {}; // { handler: { status: count } }
    const statuses = new Set();

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const status = (row[statusIdx] || 'Unknown').trim();
      const handler = (row[handlerIdx] || 'Unassigned').trim();

      if (!status || !handler) continue;

      statuses.add(status);

      if (!aggregates[handler]) aggregates[handler] = {};
      if (!aggregates[handler][status]) aggregates[handler][status] = 0;
      aggregates[handler][status]++;
    }

    // Format for charting
    const chartData = Object.entries(aggregates).map(([handler, stats]) => ({
      handler,
      ...stats
    }));

    res.json({
      statuses: Array.from(statuses),
      chartData
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error fetching data');
  }
};

// CRUD for Analytics Sources
exports.getSources = async (req, res) => {
  try {
    const sources = await AnalyticsSource.find({ createdBy: req.user.id });
    res.json(sources);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.addSource = async (req, res) => {
  const { title, url, statusCol, handlerCol } = req.body;
  try {
    const newSource = new AnalyticsSource({
      title,
      url,
      statusCol,
      handlerCol,
      createdBy: req.user.id
    });
    const source = await newSource.save();
    res.json(source);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteSource = async (req, res) => {
  try {
    await AnalyticsSource.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Source removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
