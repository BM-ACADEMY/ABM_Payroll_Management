const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

// @route   POST api/auth/signup
// @desc    Register user & send OTP
router.post('/signup', authController.signup);

// @route   POST api/auth/verify-otp
// @desc    Verify OTP for user
router.post('/verify-otp', authController.verifyOtp);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP for user verification
router.post('/resend-otp', authController.resendOtp);

// @route   POST api/auth/forgot-password
// @desc    Generate OTP for password reset
router.post('/forgot-password', authController.forgotPassword);

// @route   POST api/auth/reset-password
// @desc    Verify OTP and reset password
router.post('/reset-password', authController.resetPassword);

// @route   POST api/auth
// @desc    Authenticate user & get token
router.post('/', authController.login);

// @route   GET api/auth
// @desc    Get logged in user
router.get('/', auth, authController.getUser);

// @route   PUT api/auth/change-password
// @desc    Change password
router.put('/change-password', auth, authController.changePassword);

// @route   PUT api/auth/profile
// @desc    Update user profile
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
