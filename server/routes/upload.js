const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

// Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Upload a file
// @access  Private
router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }

  // Construct the permanent URL
  const fileUrl = `/uploads/${req.file.filename}`;
  
  res.json({
    url: fileUrl,
    name: req.file.originalname,
    fileType: req.file.mimetype,
    size: req.file.size
  });
});

module.exports = router;
