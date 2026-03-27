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
    const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user', 'name email employeeId')
      .sort({ createdAt: -1 });
    res.json(complaints);
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
