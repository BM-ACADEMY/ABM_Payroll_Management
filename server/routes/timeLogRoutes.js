const express = require('express');
const router = express.Router();
const timeLogController = require('../controllers/timeLogController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/start', auth, timeLogController.startTimeTracking);
router.patch('/pause/:id', auth, timeLogController.pauseTimeTracking);
router.patch('/resume/:id', auth, timeLogController.resumeTimeTracking);
router.patch('/stop/:id', auth, timeLogController.stopTimeTracking);
router.get('/user', auth, timeLogController.getTimeLogs);
router.get('/all', [auth, isAdmin], timeLogController.getAllTimeLogs);
router.get('/settings', auth, timeLogController.getSettings);

module.exports = router;
