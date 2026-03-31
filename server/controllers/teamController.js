const Team = require('../models/Team');
const User = require('../models/User');
const Role = require('../models/Role');

// @desc    Add new team
// @route   POST /api/admin/teams
exports.addTeam = async (req, res) => {
  const { name, description, questions } = req.body;
  try {
    let team = await Team.findOne({ name });
    if (team) return res.status(400).json({ msg: 'Team with this name already exists' });

    team = new Team({ name, description, questions });
    await team.save();
    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalCount = await Team.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const teams = await Team.find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      teams,
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: page
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update team
// @route   PATCH /api/admin/teams/:id
exports.updateTeam = async (req, res) => {
  const { name, description, questions } = req.body;
  try {
    let team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (questions) team.questions = questions;

    await team.save();
    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete team
// @route   DELETE /api/admin/teams/:id
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    await Team.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Team removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get team members
// @route   GET /api/admin/teams/:id/members
exports.getTeamMembers = async (req, res) => {
  try {
    const members = await User.find({ teams: req.params.id })
      .select('name email employeeId teams')
      .populate('role', 'name');
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update team members
// @route   POST /api/admin/teams/:id/members
exports.updateTeamMembers = async (req, res) => {
  const { userIds } = req.body; // Array of user IDs to be in the team
  const teamId = req.params.id;

  try {
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    // 1. Add team to users in the list
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { teams: teamId } }
    );

    // 2. Remove team from users NOT in the list
    await User.updateMany(
      { _id: { $nin: userIds }, teams: teamId },
      { $pull: { teams: teamId } }
    );

    res.json({ msg: 'Team members updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
