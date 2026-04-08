const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/';
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

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Upload a file
// @access  Private
router.post('/', auth, (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ 
        msg: 'Multer upload error', 
        error: err.message,
        code: err.code 
      });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({ 
        msg: 'Unknown upload error', 
        error: err.message 
      });
    }

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
});

module.exports = router;
