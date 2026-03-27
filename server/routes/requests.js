const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requestsController = require('../controllers/requestsController');

// @route   POST api/requests
// @desc    Apply for leave or permission
router.post('/', auth, requestsController.createRequest);

// @route   GET api/requests/my-requests
// @desc    Get current user's requests
router.get('/my-requests', auth, requestsController.getMyRequests);

// @route   GET api/requests/admin-requests
// @desc    Get all requests (Admin only)
router.get('/admin-requests', auth, requestsController.getAdminRequests);

// @route   GET api/requests/unread-count
// @desc    Get unread requests count (Admin only)
router.get('/unread-count', auth, requestsController.getUnreadRequestCount);

// @route   PATCH api/requests/mark-read
// @desc    Mark all requests as read (Admin only)
router.patch('/mark-read', auth, requestsController.markAsRead);

// @route   PATCH api/requests/:id
// @desc    Approve or reject request (Admin/Sub-admin)
router.patch('/:id', auth, requestsController.updateRequestStatus);

// @route   DELETE api/requests/:id
// @desc    Delete single request (Admin only)
router.delete('/:id', auth, requestsController.deleteRequest);

// @route   POST api/requests/bulk-delete
// @desc    Bulk delete requests (Admin only)
router.post('/bulk-delete', auth, requestsController.bulkDeleteRequests);

module.exports = router;
