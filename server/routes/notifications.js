const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// @route   GET api/notifications
// @desc    Get all notifications for user
router.get('/', auth, notificationController.getNotifications);

// @route   GET api/notifications/unread-count
// @desc    Get unread count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// @route   PUT api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

// @route   PUT api/notifications/read-all
// @desc    Mark all as read
router.put('/read-all', auth, notificationController.markAllAsRead);

// @route   DELETE api/notifications/:id
// @desc    Delete notification
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;
