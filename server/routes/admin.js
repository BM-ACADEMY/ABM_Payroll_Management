const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');
const teamController = require('../controllers/teamController');
const scoreController = require('../controllers/scoreController');
const checkPermission = require('../middleware/checkPermission');

// @route   GET api/admin/dashboard-stats
// @desc    Get dashboard statistics
router.get('/dashboard-stats', [auth, isAdmin], adminController.getDashboardStats);

// @route   POST api/admin/employees
// @desc    Add new employee
router.post('/employees', [auth, isAdmin, checkPermission('employees', 'create')], adminController.addEmployee);

// @route   GET api/admin/employees
// @desc    Get all employees
router.get('/employees', [auth, isAdmin, checkPermission('employees', 'read')], adminController.getEmployees);

// @route   PATCH api/admin/employees/:id
// @desc    Update employee
router.patch('/employees/:id', [auth, isAdmin, checkPermission('employees', 'update')], adminController.updateEmployee);

// @route   DELETE api/admin/employees/:id
// @desc    Delete employee
router.delete('/employees/:id', [auth, isAdmin, checkPermission('employees', 'delete')], adminController.deleteEmployee);

// --- TEAM ROUTES ---
router.get('/teams', [auth, isAdmin, checkPermission('teams', 'read')], teamController.getTeams);
router.post('/teams', [auth, isAdmin, checkPermission('teams', 'create')], teamController.addTeam);
router.patch('/teams/:id', [auth, isAdmin, checkPermission('teams', 'update')], teamController.updateTeam);
router.delete('/teams/:id', [auth, isAdmin, checkPermission('teams', 'delete')], teamController.deleteTeam);
router.get('/teams/:id/members', [auth, isAdmin, checkPermission('teams', 'read')], teamController.getTeamMembers);
router.post('/teams/:id/members', [auth, isAdmin, checkPermission('teams', 'update')], teamController.updateTeamMembers);

// --- SCORE ROUTES ---
router.get('/scores/all', [auth, isAdmin, checkPermission('credits', 'read')], scoreController.getAllWeeklyScores);
router.post('/scores', [auth, isAdmin, checkPermission('credits', 'create')], scoreController.submitScore);
router.delete('/scores/:id', [auth, isAdmin, checkPermission('credits', 'delete')], scoreController.deleteScore);


module.exports = router;
