const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../midlleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// @route   GET /api/auth/me
router.get('/me', protect, getCurrentUser);

module.exports = router;