const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const requestsController = require('../controllers/requestsController');
const checkPermission = require('../middleware/checkPermission');

// @route   POST api/requests
// @desc    Apply for leave or permission
router.post('/', auth, requestsController.createRequest);

// @route   GET api/requests/my-requests
// @desc    Get current user's requests
router.get('/my-requests', auth, requestsController.getMyRequests);

// @route   GET api/requests/admin-requests
// @desc    Get all requests (Admin only)
router.get('/admin-requests', [auth, isAdmin, checkPermission('permissions', 'read')], requestsController.getAdminRequests);

// @route   GET api/requests/unread-count
// @desc    Get unread requests count (Admin only)
router.get('/unread-count', [auth, isAdmin], requestsController.getUnreadRequestCount);

// @route   PATCH api/requests/mark-read
// @desc    Mark all requests as read (Admin only)
router.patch('/mark-read', [auth, isAdmin, checkPermission('permissions', 'update')], requestsController.markAsRead);

// @route   PATCH api/requests/:id
// @desc    Approve or reject request (Admin/Sub-admin)
router.patch('/:id', [auth, isAdmin, checkPermission('permissions', 'update')], requestsController.updateRequestStatus);

// @route   DELETE api/requests/:id
// @desc    Delete single request (Admin or Owner)
router.delete('/:id', auth, requestsController.deleteRequest);

// @route   POST api/requests/bulk-delete
// @desc    Bulk delete requests (Admin only)
router.post('/bulk-delete', [auth, isAdmin, checkPermission('permissions', 'delete')], requestsController.bulkDeleteRequests);

// @route   GET api/requests/action/:id
// @desc    Handle Approve/Reject via Email Link (Secure Public Route)
router.get('/action/:id', requestsController.handleEmailAction);

module.exports = router;
