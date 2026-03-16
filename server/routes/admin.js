const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

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
// @desc    Delete employee
router.delete('/employees/:id', [auth, isAdmin], adminController.deleteEmployee);

module.exports = router;
