const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const fs = require('fs');
const path = require('path');

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    console.log('Upload profile picture request received:', {
      user: req.user ? req.user._id : 'No user in request',
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename
      } : 'No file in request'
    });

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture && user.profilePicture !== '/default-avatar.png') {
      try {
        const oldFilePath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Deleted old profile picture:', oldFilePath);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue with the upload even if deleting old picture fails
      }
    }

    // Save new profile picture path
    const profilePicturePath = '/uploads/profile-pictures/' + req.file.filename;
    user.profilePicture = profilePicturePath;
    await user.save();

    console.log('Profile picture updated for user:', userId, 'New path:', profilePicturePath);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePicturePath,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: profilePicturePath
      }
    });
  } catch (error) {
    console.error('Error in uploadProfilePicture:', {
      error: error.message,
      stack: error.stack,
      request: {
        user: req.user,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      }
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while uploading profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/upload/profile-picture
// @access  Private
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete current profile picture if it exists
    if (user.profilePicture && user.profilePicture !== '/default-avatar.png') {
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Set to default avatar
    user.profilePicture = '/default-avatar.png';
    await user.save();

    res.json({
      message: 'Profile picture deleted successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Test endpoint to verify upload functionality
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload routes are working',
    uploadsDir: path.join(__dirname, '..', 'uploads', 'profile-pictures'),
    exists: fs.existsSync(path.join(__dirname, '..', 'uploads', 'profile-pictures'))
  });
});

// Upload single profile picture
router.post('/profile-picture', protect, uploadMiddleware, uploadProfilePicture);

// Delete profile picture
router.delete('/profile-picture', protect, deleteProfilePicture);

module.exports = router; 