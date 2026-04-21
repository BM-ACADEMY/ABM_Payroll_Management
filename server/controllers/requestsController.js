const Request = require('../models/Request');
const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const { sendRequestNotificationToAdmins, sendRequestResponseToUser } = require('../services/emailService');

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

    // --- EMAIL NOTIFICATION LOGIC ---
    try {
      const requester = await User.findById(req.user.id);
      const adminRole = await Role.findOne({ name: 'admin' });
      const admins = await User.find({ role: adminRole._id });
      const adminEmails = admins.map(a => a.email).filter(e => !!e);

      if (adminEmails.length > 0 && requester) {
        const generateToken = (action) => jwt.sign(
          { requestId: request._id, status: action, adminId: admins[0]._id },
          process.env.JWT_SECRET,
          { expiresIn: '72h' }
        );

        const apiUrl = process.env.API_URL || 'http://localhost:5000';
        const approvalUrl = `${apiUrl}/api/requests/action/${request._id}?status=approved&token=${generateToken('approved')}`;
        const rejectionUrl = `${apiUrl}/api/requests/action/${request._id}?status=rejected&token=${generateToken('rejected')}`;

        const requestData = {
          userName: requester.name,
          userId: requester.employeeId || 'ID_N/A',
          type: request.type,
          reason: request.reason,
          appliedOn: new Date().toLocaleDateString(),
          approvalUrl,
          rejectionUrl,
          details: request.type === 'leave' ? `${request.duration} days` : request.totalPermissionTime || 'Authorization Vector'
        };

        await sendRequestNotificationToAdmins(adminEmails, requestData);
      }
    } catch (emailErr) {
      console.error('Failed to trigger admin notification email:', emailErr);
    }
    // --------------------------------

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMyRequests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  try {
    const total = await Request.countDocuments({ user: req.user.id });
    const requests = await Request.find({ user: req.user.id })
      .populate('verifyByAdminUserId', 'name')
      .sort({ appliedOn: -1 })
      .limit(limit)
      .skip(skip);
    
    res.json({ 
      requests, 
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getAdminRequests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const { name } = req.query;

  try {
    let query = {};
    if (name) {
      const User = require('../models/User');
      const users = await User.find({ name: { $regex: name, $options: 'i' } }).select('_id');
      const userIds = users.map(u => u._id);
      
      query = {
        $or: [
          { user: { $in: userIds } },
          { reason: { $regex: name, $options: 'i' } }
        ]
      };
    }

    const total = await Request.countDocuments(query);
    const requests = await Request.find(query)
      .populate('user', 'name email employeeId')
      .sort({ appliedOn: -1 })
      .limit(limit)
      .skip(skip);
    
    res.json({ 
      requests, 
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
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

    // --- EMAIL NOTIFICATION LOGIC ---
    try {
      const user = await User.findById(request.user);
      const admin = await User.findById(req.user.id);
      
      if (user && user.email) {
        const responseData = {
          userName: user.name,
          status: request.status,
          type: request.type,
          adminName: admin ? admin.name : 'Management',
          reason: request.reason,
          feedback: status === 'rejected' ? rejectedReason : 'Authorized by system administrator.'
        };
        await sendRequestResponseToUser(user.email, responseData);
      }
    } catch (emailErr) {
      console.error('Failed to trigger user notification email:', emailErr);
    }
    // --------------------------------

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   DELETE /api/requests/:id
exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    // Authorization Logic:
    // 1. If admin, full access.
    // 2. If employee, must be owner AND status must not be 'approved'.
    const userRole = await Role.findById(req.user.role);
    const isAdmin = userRole && (userRole.name === 'admin' || userRole.name === 'subadmin');

    if (!isAdmin) {
      if (request.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Unauthorized to delete this record.' });
      }
      if (request.status === 'approved') {
        return res.status(400).json({ msg: 'Approved requests cannot be deleted by users. Please contact administration.' });
      }
    }

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

// @desc    Handle Approve/Reject via Email Link
exports.handleEmailAction = async (req, res) => {
  const { id } = req.params;
  const { status, token } = req.query;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.requestId !== id || decoded.status !== status) {
      return res.status(400).send('<div style="font-family:sans-serif; text-align:center; padding:50px;"><h1>Invalid Token</h1><p>This action link is corrupted or invalid.</p></div>');
    }

    let request = await Request.findById(id).populate('user', 'name email');
    if (!request) return res.status(404).send('<div style="font-family:sans-serif; text-align:center; padding:50px;"><h1>Not Found</h1><p>The request record no longer exists.</p></div>');
    
    if (request.status !== 'pending') {
      return res.status(400).send(`<div style="font-family:sans-serif; text-align:center; padding:50px;"><h1>Action Already Processed</h1><p>This request has already been <strong>${request.status}</strong>.</p></div>`);
    }

    request.status = status;
    request.isApproved = status === 'approved';
    request.verifyByAdminUserId = decoded.adminId;
    await request.save();

    // Send Response Email to User
    const responseData = {
      userName: request.user.name,
      status: request.status,
      type: request.type,
      adminName: 'Board of Directors (via Remote Auth)',
      reason: request.reason,
      feedback: `Remote authorization processed successfully. Decision: ${status.toUpperCase()}`
    };
    await sendRequestResponseToUser(request.user.email, responseData);

    if (req.io) {
      req.io.emit('request_updated', { userId: request.user._id, status: request.status });
    }

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 100px 20px; background-color: #f8fafc; min-height: 100vh; box-sizing: border-box;">
        <div style="max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
          <div style="width: 60px; height: 60px; background: ${status === 'approved' ? '#10b981' : '#ef4444'}; border-radius: 20px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 32px; height: 32px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="${status === 'approved' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"></path></svg>
          </div>
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Action Sequence Finalized</h1>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 32px;">The request for <strong>${request.user.name}</strong> has been <strong>${status.toUpperCase()}</strong>.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: block; background: #000000; color: #fffe01; text-decoration: none; padding: 16px; border-radius: 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">
            Return to Core Panel
          </a>
        </div>
      </div>
    `);
  } catch (err) {
    console.error('Email Action Verification Error:', err);
    res.status(401).send('<div style="font-family:sans-serif; text-align:center; padding:50px;"><h1>Vector Access Expired</h1><p>The secure authorization link has expired. Please log in to the panel to process this request.</p></div>');
  }
};
