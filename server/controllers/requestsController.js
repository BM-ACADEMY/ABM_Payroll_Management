const Request = require('../models/Request');

// @desc    Apply for leave or permission
exports.createRequest = async (req, res) => {
  const { type, date, startTime, endTime, fromDateTime, toDateTime, duration, reason } = req.body;
  try {
    if (type === 'permission') {
      const pendingRequest = await Request.findOne({ 
        user: req.user.id, 
        type: 'permission', 
        status: 'pending' 
      });
      if (pendingRequest) {
        return res.status(400).json({ msg: 'You already have a pending permission request. Please wait for it to be reviewed.' });
      }
    }

    let totalPermissionTime = '';
    if (type === 'permission' && fromDateTime && toDateTime) {
      const diffInMs = new Date(toDateTime) - new Date(fromDateTime);
      const totalMinutes = Math.floor(diffInMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      totalPermissionTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hrs`;
    }

    const newRequest = new Request({
      user: req.user.id,
      type,
      date,
      startTime,
      endTime,
      fromDateTime,
      toDateTime,
      duration,
      totalPermissionTime,
      reason,
      isReadByAdmin: false 
    });
    const request = await newRequest.save();
    
    // Emit real-time notification
    if (req.io) {
      req.io.emit('new_request', { user: req.user.id });
    }

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current user's requests with pagination
exports.getMyRequests = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const skip = parseInt(req.query.skip) || 0;
  try {
    const requests = await Request.find({ user: req.user.id })
      .sort({ appliedOn: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Request.countDocuments({ user: req.user.id });
    res.json({ requests, total, hasMore: skip + requests.length < total });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all requests (Admin) with pagination
exports.getAdminRequests = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const skip = parseInt(req.query.skip) || 0;
  try {
    const requests = await Request.find()
      .populate('user', 'name email employeeId')
      .sort({ appliedOn: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Request.countDocuments();
    res.json({ requests, total, hasMore: skip + requests.length < total });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get unread requests count (Admin)
exports.getUnreadRequestCount = async (req, res) => {
  try {
    const count = await Request.countDocuments({ isReadByAdmin: false });
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Mark all as read (Admin)
exports.markAsRead = async (req, res) => {
  try {
    await Request.updateMany({ isReadByAdmin: false }, { isReadByAdmin: true });
    
    // Emit event to update badge
    if (req.io) {
      req.io.emit('requests_read');
    }

    res.json({ msg: 'Requests marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Approve or reject request (Admin/Sub-admin)
exports.updateRequestStatus = async (req, res) => {
  const { status, rejectedReason } = req.body;
  try {
    let request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    request.status = status;
    request.verifyByAdminUserId = req.user.id;
    request.isApproved = status === 'approved';
    if (status === 'rejected') {
      request.rejectedReason = rejectedReason;
    }
    
    await request.save();

    // Emit real-time notification to employee
    if (req.io) {
      req.io.emit('request_updated', { userId: request.user, status: request.status });
    }

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete single request (Admin)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    await request.deleteOne();
    
    if (req.io) {
      req.io.emit('request_deleted', { id: req.params.id });
    }

    res.json({ msg: 'Request removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Bulk delete requests (Admin)
exports.bulkDeleteRequests = async (req, res) => {
  const { ids } = req.body;
  try {
    if (!ids || !ids.length) return res.status(400).json({ msg: 'No IDs provided' });
    
    await Request.deleteMany({ _id: { $in: ids } });

    if (req.io) {
      req.io.emit('requests_bulk_deleted', { ids });
    }

    res.json({ msg: 'Requests removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
