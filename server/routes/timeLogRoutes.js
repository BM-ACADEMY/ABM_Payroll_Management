const express = require('express');
const router = express.Router();
const timeLogController = require('../controllers/timeLogController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.all('/start', auth, timeLogController.startTimeTracking);
router.all('/pause/:id', auth, timeLogController.pauseTimeTracking);
router.all('/resume/:id', auth, timeLogController.resumeTimeTracking);
router.all('/stop/:id', auth, timeLogController.stopTimeTracking);
router.all('/restart/:id', auth, timeLogController.restartTimeTracking);
router.patch('/comment/:id', auth, timeLogController.addComment);
router.patch('/comment/:id/:commentId', auth, timeLogController.updateComment);
router.delete('/comment/:id/:commentId', auth, timeLogController.deleteComment);
router.patch('/status/:id', auth, timeLogController.updateStatus);

router.get('/active', auth, timeLogController.getActiveTimeLogs);
router.get('/user', auth, timeLogController.getTimeLogs);
router.get('/all', [auth, isAdmin], timeLogController.getAllTimeLogs);
router.get('/settings', auth, timeLogController.getSettings);
router.get('/:id', auth, timeLogController.getTimeLogById);
router.post('/paused-log', auth, timeLogController.createPausedLog);
router.delete('/:id', auth, timeLogController.deleteTimeLog);

module.exports = router;
