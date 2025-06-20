const express = require('express');
const router = express.Router();
const { googleLogin, facebookLogin } = require('../controllers/socialAuthController');

// @route   POST /api/auth/google
// @desc    Authenticate user with Google
// @access  Public
router.post('/google', googleLogin);

// @route   POST /api/auth/facebook
// @desc    Authenticate user with Facebook
// @access  Public
router.post('/facebook', facebookLogin);

module.exports = router;
