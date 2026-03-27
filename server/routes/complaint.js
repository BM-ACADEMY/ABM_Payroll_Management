const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const complaintController = require('../controllers/complaintController');

// @route   POST api/complaints
// @desc    Submit a complaint
router.post('/', auth, complaintController.createComplaint);

// @route   GET api/complaints/my
// @desc    Get current user's complaints
router.get('/my', auth, complaintController.getMyComplaints);

// @route   GET api/complaints
// @desc    Get all complaints (Admin)
router.get('/', [auth, isAdmin], complaintController.getAllComplaints);

// @route   PUT api/complaints/:id
// @desc    Update complaint status (Admin)
router.put('/:id', [auth, isAdmin], complaintController.updateComplaint);

module.exports = router;
