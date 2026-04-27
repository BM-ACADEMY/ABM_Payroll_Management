const express = require('express');
const router = express.Router();
const timeLogController = require('../controllers/timeLogController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/start', auth, timeLogController.startTimeTracking);
router.patch('/pause/:id', auth, timeLogController.pauseTimeTracking);
router.patch('/resume/:id', auth, timeLogController.resumeTimeTracking);
router.patch('/stop/:id', auth, timeLogController.stopTimeTracking);
router.patch('/restart/:id', auth, timeLogController.restartTimeTracking);
router.patch('/comment/:id', auth, timeLogController.addComment);
router.patch('/comment/:id/:commentId', auth, timeLogController.updateComment);
router.delete('/comment/:id/:commentId', auth, timeLogController.deleteComment);
router.patch('/status/:id', auth, timeLogController.updateStatus);

router.get('/active', auth, timeLogController.getActiveTimeLogs);
router.get('/user', auth, timeLogController.getTimeLogs);
router.get('/all', [auth, isAdmin], timeLogController.getAllTimeLogs);
router.get('/settings', auth, timeLogController.getSettings);
router.post('/paused-log', auth, timeLogController.createPausedLog);
router.delete('/:id', auth, timeLogController.deleteTimeLog);

module.exports = router;
