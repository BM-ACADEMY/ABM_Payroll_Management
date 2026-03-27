const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const companyLeaveController = require('../controllers/companyLeaveController');

// @route   POST api/company-leaves
// @desc    Add company leave (Admin)
router.post('/', [auth, isAdmin], companyLeaveController.addLeave);

// @route   GET api/company-leaves
// @desc    Get all company leaves (Admin/Employee)
router.get('/', auth, companyLeaveController.getLeaves);

// @route   DELETE api/company-leaves/:id
// @desc    Delete company leave (Admin)
router.delete('/:id', [auth, isAdmin], companyLeaveController.deleteLeave);

module.exports = router;
