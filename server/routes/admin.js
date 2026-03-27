const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');
const teamController = require('../controllers/teamController');
const scoreController = require('../controllers/scoreController');

// @route   GET api/admin/dashboard-stats
// @desc    Get dashboard statistics
router.get('/dashboard-stats', [auth, isAdmin], adminController.getDashboardStats);

// @route   POST api/admin/employees
// @desc    Add new employee
router.post('/employees', [auth, isAdmin], adminController.addEmployee);

// @route   GET api/admin/employees
// @desc    Get all employees
router.get('/employees', [auth, isAdmin], adminController.getEmployees);

// @route   PATCH api/admin/employees/:id
// @desc    Update employee
router.patch('/employees/:id', [auth, isAdmin], adminController.updateEmployee);

// @route   DELETE api/admin/employees/:id
router.delete('/employees/:id', [auth, isAdmin], adminController.deleteEmployee);

// --- TEAM ROUTES ---
router.get('/teams', [auth, isAdmin], teamController.getTeams);
router.post('/teams', [auth, isAdmin], teamController.addTeam);
router.patch('/teams/:id', [auth, isAdmin], teamController.updateTeam);
router.delete('/teams/:id', [auth, isAdmin], teamController.deleteTeam);
router.get('/teams/:id/members', [auth, isAdmin], teamController.getTeamMembers);
router.post('/teams/:id/members', [auth, isAdmin], teamController.updateTeamMembers);

// --- SCORE ROUTES ---
router.get('/scores/all', [auth, isAdmin], scoreController.getAllWeeklyScores);
router.post('/scores', [auth, isAdmin], scoreController.submitScore);
router.delete('/scores/:id', [auth, isAdmin], scoreController.deleteScore);


module.exports = router;
