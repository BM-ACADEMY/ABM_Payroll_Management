const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Request = require('../models/Request');

// @route   POST api/requests
// @desc    Apply for leave or permission
router.post('/', auth, async (req, res) => {
  const { type, date, startTime, endTime, duration, reason } = req.body;
  try {
    const newRequest = new Request({
      user: req.user.id,
      type,
      date,
      startTime,
      endTime,
      duration,
      reason
    });
    const request = await newRequest.save();
    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/requests/:id
// @desc    Approve or reject request (Admin/Sub-admin)
router.patch('/:id', auth, async (req, res) => {
  const { status } = req.body;
  try {
    let request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    request.status = status;
    await request.save();
    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
