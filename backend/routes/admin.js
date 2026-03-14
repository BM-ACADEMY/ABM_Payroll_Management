const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  next();
};

// @route   POST api/admin/employees
// @desc    Add new employee
router.post('/employees', [auth, isAdmin], async (req, res) => {
  const { name, email, password, role, employeeId, baseSalary } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password, role, employeeId, baseSalary });
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/employees
// @desc    Get all employees
router.get('/employees', [auth, isAdmin], async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
