const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/isAdmin');
const {
  getPerformanceStats,
  getSources,
  addSource,
  deleteSource,
  getSourceData
} = require('../controllers/analyticsController');

// All routes require auth
router.use(auth);

// Performance stats (Admin only)
router.get('/performance', admin, getPerformanceStats);

// Analytics Sources (Admin only)
router.get('/sources', admin, getSources);
router.post('/sources', admin, addSource);
router.delete('/sources/:id', admin, deleteSource);

// Google Sheet Fetch & Parse (Admin only)
router.get('/data/:id', admin, getSourceData);

module.exports = router;
