const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { sendOTPEmail } = require('../services/emailService');
const CompanyLeave = require('../models/CompanyLeave');
const Attendance = require('../models/Attendance');


// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const validatePassword = (password) => {
  // At least one capital letter, one number, one symbol, and more than 6 characters (>=7)
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{7,}$/;
  return passwordRegex.test(password);
};

// @desc    Register user & send OTP
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!validatePassword(password)) {
    return res.status(400).json({ msg: 'Password must contain at least 1 capital letter, 1 number, 1 symbol, and be more than 6 characters long.' });
  }
  
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    
    // Fetch the default 'employee' role ObjectId
    const employeeRole = await Role.findOne({ name: 'employee' });
    if (!employeeRole) {
      return res.status(500).json({ msg: 'Server setup error: default roles not found' });
    }
    
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    user = new User({
      name,
      email,
      password,
      role: employeeRole._id,
      otp,
      otpExpires,
      isEmailVerified: false,
    });
    
    await user.save();
    
    // Send the OTP via email
    await sendOTPEmail(email, otp);
    console.log(`[EMAIL DISPATCHED] Registration OTP for ${email} is: ${otp}`);
    
    res.status(200).json({ msg: 'User registered. Please verify your OTP sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Verify OTP for user
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Email/User not found' });
    
    if (user.isEmailVerified) {
      return res.status(400).json({ msg: 'Email is already verified' });
    }
    
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
    
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();
    
    // Assign future company holidays to the new employee
    try {
      const futureHolidays = await CompanyLeave.find({ date: { $gte: new Date() } });
      const holidayPromises = futureHolidays.map(holiday => {
        return new Attendance({
          user: user._id,
          date: holiday.date,
          isHoliday: true,
          leaveStatus: 'leave'
        }).save();
      });
      await Promise.all(holidayPromises);
    } catch (holidayErr) {
      console.error('Error assigning future holidays:', holidayErr.message);
      // We don't block the verification if holiday assignment fails, but we log it
    }

    
    res.status(200).json({ msg: 'OTP verified successfully. You can now login.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Resend OTP for user verification
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User with this email does not exist' });
    
    if (user.isEmailVerified) {
      return res.status(400).json({ msg: 'Email is already verified' });
    }
    
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    
    await user.save();
    
    await sendOTPEmail(email, otp);
    console.log(`[EMAIL DISPATCHED] Resent Registration OTP for ${email} is: ${otp}`);
    
    res.status(200).json({ msg: 'A new OTP has been sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Generate OTP for password reset
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User with this email does not exist' });
    
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    
    await user.save();
    
    await sendOTPEmail(email, otp);
    console.log(`[EMAIL DISPATCHED] Password reset OTP for ${email} is: ${otp}`);
    
    res.status(200).json({ msg: 'Password reset OTP sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Verify OTP and reset password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (!validatePassword(newPassword)) {
    return res.status(400).json({ msg: 'Password must contain at least 1 capital letter, 1 number, 1 symbol, and be more than 6 characters long.' });
  }
  
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Email/User not found' });
    
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
    
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ msg: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Authenticate user & get token
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    if (!user.isEmailVerified) {
      return res.status(400).json({ msg: 'Please verify your email first', emailNotVerified: true });
    }

    // Populate role so we send back { name: 'admin', permissions: [...] }
    await user.populate('role', 'name permissions');

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get logged in user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('role', 'name permissions');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
