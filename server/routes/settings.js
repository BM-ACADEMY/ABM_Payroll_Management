const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const admin = require('../middleware/isAdmin');

// @route   GET api/settings
// @desc    Get global settings
// @access  Private (Admins only for now, though some values might be needed by employees later)
router.get('/', auth, admin, getSettings);

// @route   POST api/settings
// @desc    Update global settings
// @access  Private (Admin only)
router.post('/', auth, admin, updateSettings);

module.exports = router;
