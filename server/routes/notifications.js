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

// @route   POST api/notifications/subscribe
// @desc    Subscribe to push notifications
router.post('/subscribe', auth, notificationController.subscribe);

// @route   GET api/notifications/vapid-public-key
// @desc    Get VAPID public key
router.get('/vapid-public-key', auth, notificationController.getVapidPublicKey);

module.exports = router;
