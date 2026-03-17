const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { sendOTPEmail } = require('../services/emailService');

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
// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ msg: 'New password must contain at least 1 capital letter, 1 number, 1 symbol, and be more than 6 characters long.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  let { name, email, phoneNumber } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Validate phone number if provided (exactly 10 digits)
    if (phoneNumber) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ msg: 'Phone number must be exactly 10 digits' });
      }
    }

    // Check if email is already taken by another user
    if (email) {
      email = email.toLowerCase();
      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: 'Email already exists' });
        user.email = email;
      }
    }

    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    
    user.updatedAt = Date.now();
    await user.save();
    
    // Return updated user (without password)
    const updatedUser = await User.findById(req.user.id).select('-password').populate('role', 'name permissions');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
