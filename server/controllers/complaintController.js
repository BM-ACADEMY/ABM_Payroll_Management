const Complaint = require('../models/Complaint');

// @desc    Submit a complaint
// @route   POST /api/complaints
exports.createComplaint = async (req, res) => {
  const { subject, description } = req.body;
  try {
    const complaint = new Complaint({
      user: req.user.id,
      subject,
      description
    });
    await complaint.save();
    res.json(complaint);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current user's complaints
// @route   GET /api/complaints/my
exports.getMyComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalCount = await Complaint.countDocuments({ user: req.user.id });
    const totalPages = Math.ceil(totalCount / limit);

    const complaints = await Complaint.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      complaints,
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: page
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalCount = await Complaint.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const complaints = await Complaint.find()
      .populate('user', 'name email employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      complaints,
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: page
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update complaint status/reason (Admin)
// @route   PUT /api/complaints/:id
exports.updateComplaint = async (req, res) => {
  const { status, adminResponse } = req.body;
  try {
    let complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

    complaint.status = status || complaint.status;
    complaint.adminResponse = adminResponse || complaint.adminResponse;
    complaint.updatedAt = Date.now();
    
    await complaint.save();
    res.json(complaint);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
