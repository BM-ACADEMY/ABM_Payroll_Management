const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const scoreController = require('../controllers/scoreController');

// @route   GET api/scores/my-score
// @desc    Get current user's weekly scores
router.get('/my-score', auth, scoreController.getMyWeeklyScore);

// @route   GET api/scores/history
// @desc    Get current user's historical scores
router.get('/history', auth, scoreController.getMyScoreHistory);

module.exports = router;
