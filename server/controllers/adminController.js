const User = require('../models/User');
const Role = require('../models/Role');
const Attendance = require('../models/Attendance');
const Request = require('../models/Request');
const { format } = require('date-fns');

// @desc    Add new employee
exports.addEmployee = async (req, res) => {
  const { employeeId, name, email, phoneNumber, password, baseSalary, timingSettings, teams } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    // Enforce strong password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{7,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ msg: 'Password must contain at least 1 capital letter, 1 number, 1 symbol, and be >6 chars.' });
    }

    // Get 'employee' role ObjectId
    const employeeRole = await Role.findOne({ name: 'employee' });
    if (!employeeRole) return res.status(500).json({ msg: 'Employee role not found in DB' });

    user = new User({ 
      name, 
      email, 
      phoneNumber, 
      password, 
      role: employeeRole._id, 
      employeeId, 
      baseSalary: baseSalary || 0,
      timingSettings: timingSettings || undefined,
      teams: teams || [],
      isEmailVerified: true // Admin-created employees are instantly verified
    });
    
    await user.save();
    
    // Return populated user 
    await user.populate('role', 'name');
    await user.populate('teams', 'name questions');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all employees
exports.getEmployees = async (req, res) => {
  const { limit, fields } = req.query;
  try {
    const employeeRole = await Role.findOne({ name: 'employee' });
    if (!employeeRole) return res.status(500).json({ msg: 'Employee role not found' });

    let query = User.find({ role: employeeRole._id });
    
    if (fields) {
      query = query.select(fields.split(',').join(' '));
    } else {
      query = query.select('-password -otp -otpExpires');
    }

    query = query.populate('role', 'name permissions')
      .populate('teams', 'name questions')
      .sort({ createdAt: -1 });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const employees = await query;
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update employee details
exports.updateEmployee = async (req, res) => {
  const { employeeId, name, email, phoneNumber, baseSalary, password, timingSettings, teams } = req.body;
  
  try {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'Employee not found' });

    // Optional: Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ msg: 'Email already exists' });
    }

    if (employeeId) user.employeeId = employeeId;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (baseSalary !== undefined) user.baseSalary = baseSalary;
    
    if (timingSettings) {
      user.timingSettings = {
        ...user.timingSettings,
        ...timingSettings
      };
    }

    if (teams) user.teams = teams;

    if (password) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{7,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ msg: 'Password must contain at least 1 capital letter, 1 number, 1 symbol, and be >6 chars.' });
      }
      user.password = password; // Mongoose schema will hash this automatically if using pre-save hook, but let's assume it hashes because signup worked directly assigning `password`.
    }

    await user.save();
    
    // Return updated populated user
    await user.populate('role', 'name');
    await user.populate('teams', 'name questions');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'Employee not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Employee removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
// @desc    Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const AdminService = require('../services/AdminService');
    const statsData = await AdminService.getDashboardStats();
    res.json(statsData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
