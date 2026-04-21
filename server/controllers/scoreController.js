const Score = require('../models/Score');
const User = require('../models/User');
const Team = require('../models/Team');
const { format, startOfWeek } = require('date-fns');

// @desc    Submit/Update weekly score for an employee (Admin)
// @route   POST /api/admin/scores
exports.submitScore = async (req, res) => {
  const { userId, teamId, weekStartDate, answers, feedback } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    // Calculate total score
    const totalCredits = answers.reduce((acc, curr) => acc + (curr.creditsReceived || 0), 0);

    let score = await Score.findOne({ user: userId, team: teamId, weekStartDate });

    if (score) {
      score.answers = answers;
      score.totalCredits = totalCredits;
      score.feedback = feedback;
      score.submittedBy = req.user.id;
    } else {
      score = new Score({
        user: userId,
        team: teamId,
        weekStartDate,
        answers,
        totalCredits,
        feedback,
        submittedBy: req.user.id
      });
    }

    await score.save();
    res.json(score);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get weekly scores for an employee (Employee/Admin)
// @route   GET /api/scores/my-score
exports.getMyWeeklyScore = async (req, res) => {
  const { weekStartDate } = req.query; // If not provided, use current week's start (Monday)
  const startDate = weekStartDate || format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  try {
    const scores = await Score.find({ user: req.user.id, weekStartDate: startDate })
      .populate('team', 'name description questions');
    
    // Performance assessment
    const getPerformanceMessage = (score) => {
      if (score >= 90) return { title: "Excellent", msg: "Eligible for recognition or incentives", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
      if (score >= 80) return { title: "Good", msg: "Maintain performance", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
      if (score >= 70) return { title: "Acceptable", msg: "Minor improvement recommended", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
      if (score >= 60) return { title: "Below Expectation", msg: "Improvement plan", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" };
      return { title: "Poor Performance", msg: "HR meeting and corrective action", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
    };

    const evaluatedScores = scores.map(s => ({
      ...s.toObject(),
      assessment: getPerformanceMessage(s.totalCredits)
    }));

    res.json(evaluatedScores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get historical scores for an employee (Employee/Admin)
// @route   GET /api/scores/history
exports.getMyScoreHistory = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user.id })
      .populate('team', 'name description')
      .sort({ weekStartDate: -1 });
    
    const getPerformanceMessage = (score) => {
      if (score >= 90) return { title: "Excellent", msg: "Eligible for recognition or incentives", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
      if (score >= 80) return { title: "Good", msg: "Maintain performance", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
      if (score >= 70) return { title: "Acceptable", msg: "Minor improvement recommended", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
      if (score >= 60) return { title: "Below Expectation", msg: "Improvement plan", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" };
      return { title: "Poor Performance", msg: "HR meeting and corrective action", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
    };

    const evaluatedScores = scores.map(s => ({
      ...s.toObject(),
      assessment: getPerformanceMessage(s.totalCredits)
    }));

    res.json(evaluatedScores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all scores for a week (Admin)
// @route   GET /api/admin/scores/all
exports.getAllWeeklyScores = async (req, res) => {
  const { weekStartDate, page = 1, limit = 10, name, team } = req.query; // Defaulted limit to 10 for better view
  const startDate = weekStartDate || format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  try {
    let query = { weekStartDate: startDate };

    // Filter by team
    if (team && team !== 'all') {
      query.team = team;
    }

    // Search by name (Regex)
    if (name) {
      const users = await User.find({ name: { $regex: name, $options: 'i' } }).select('_id');
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    const totalCount = await Score.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    const scores = await Score.find(query)
      .populate('user', 'name employeeId')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      scores,
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

// @desc    Delete a score (Admin)
// @route   DELETE /api/admin/scores/:id
exports.deleteScore = async (req, res) => {
  try {
    const score = await Score.findById(req.params.id);
    if (!score) return res.status(404).json({ msg: 'Score not found' });

    await Score.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Score deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
