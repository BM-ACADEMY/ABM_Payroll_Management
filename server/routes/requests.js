const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requestsController = require('../controllers/requestsController');

// @route   POST api/requests
// @desc    Apply for leave or permission
router.post('/', auth, requestsController.createRequest);

// @route   PATCH api/requests/:id
// @desc    Approve or reject request (Admin/Sub-admin)
router.patch('/:id', auth, requestsController.updateRequestStatus);

module.exports = router;
