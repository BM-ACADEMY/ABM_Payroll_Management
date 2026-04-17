const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const SitePhoto = require('../models/SitePhoto');
const User = require('../models/User');

// Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/site-photos/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// @route   POST /api/site-photos
// @desc    Upload a site photo with metadata
// @access  Private
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No photo uploaded' });
    }

    const { date, day, time, lat, lng, address } = req.body;

    const newPhoto = new SitePhoto({
      user: req.user.id,
      imageUrl: `/uploads/site-photos/${req.file.filename}`,
      date,
      day,
      time,
      location: {
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        address
      }
    });

    const photo = await newPhoto.save();
    
    // Populate user info for frontend
    await photo.populate('user', 'name email');

    res.json(photo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/site-photos
// @desc    Get site photos based on role with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, userName } = req.query;
    
    let query = {};
    
    const currentUser = await User.findById(req.user.id).populate('role');
    const isAdmin = ['admin', 'subadmin'].includes(currentUser?.role?.name);

    if (!isAdmin) {
      query.user = req.user.id;
    } else if (userName) {
      // If admin and searching by name, find users first
      const users = await User.find({ name: { $regex: userName, $options: 'i' } });
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const totalCount = await SitePhoto.countDocuments(query);
    const photos = await SitePhoto.find(query)
      .populate('user', 'name email employeeId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      photos,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
