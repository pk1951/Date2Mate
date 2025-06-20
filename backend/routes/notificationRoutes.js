const express = require('express');
const router = express.Router();
const { getNotifications, getChatActivity } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/notifications
router.get('/', protect, getNotifications);

// @route   GET /api/notifications/activity
router.get('/activity', protect, getChatActivity);

module.exports = router; 