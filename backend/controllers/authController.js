const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');
const UserState = require('../models/userStateModel');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send email function
const sendEmail = async (options) => {
  try {
    await transporter.sendMail({
      from: `"Mindful Dating" <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, age, gender } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Handle location field properly - ensure it's a string
    let location = '';
    if (req.body.location) {
      if (typeof req.body.location === 'string') {
        location = req.body.location;
      } else if (typeof req.body.location === 'object' && req.body.location !== null) {
        // If it's an object, try to extract a meaningful string
        location = JSON.stringify(req.body.location);
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      age,
      gender,
      location,
      isProfileComplete: false,
    });

    // Create initial user state
    await UserState.create({
      user: user._id,
      currentState: 'available',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        isProfileComplete: user.isProfileComplete,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user state
    const userState = await UserState.findOne({ user: user._id });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      isProfileComplete: user.isProfileComplete,
      currentState: userState ? userState.currentState : 'available',
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user state
    const userState = await UserState.findOne({ user: user._id });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      location: user.location,
      profilePicture: user.profilePicture,
      personality: user.personality,
      emotionalPatterns: user.emotionalPatterns,
      relationshipPreferences: user.relationshipPreferences,
      interests: user.interests,
      bio: user.bio,
      isProfileComplete: user.isProfileComplete,
      currentState: userState ? userState.currentState : 'available',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2)); // Debug log
    
    // Remove isProfileComplete from request body to prevent frontend interference
    const { isProfileComplete, ...updateData } = req.body;
    console.log('isProfileComplete removed from request:', isProfileComplete); // Debug log
    
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    user.name = updateData.name || user.name;
    user.email = updateData.email || user.email;
    user.age = updateData.age || user.age;
    user.gender = updateData.gender || user.gender;
    
    // Handle location field properly - ensure it's a string
    if (updateData.location !== undefined) {
      if (typeof updateData.location === 'string') {
        user.location = updateData.location;
      } else if (typeof updateData.location === 'object' && updateData.location !== null) {
        // If it's an object, try to extract a meaningful string
        user.location = JSON.stringify(updateData.location);
      } else {
        user.location = '';
      }
    }
    
    user.profilePicture = updateData.profilePicture || user.profilePicture;
    user.bio = updateData.bio || user.bio;
    
    // Update complex fields if provided
    if (updateData.personality) {
      user.personality = {
        ...user.personality,
        ...updateData.personality,
      };
    }
    
    if (updateData.emotionalPatterns) {
      user.emotionalPatterns = {
        ...user.emotionalPatterns,
        ...updateData.emotionalPatterns,
      };
    }
    
    if (updateData.relationshipPreferences) {
      user.relationshipPreferences = {
        ...user.relationshipPreferences,
        ...updateData.relationshipPreferences,
      };
    }
    
    if (updateData.interests) {
      user.interests = updateData.interests;
    }
    
    // Check if profile is now complete - ONLY calculate this, don't accept from frontend
    const isComplete = (
      user.name && 
      user.email && 
      user.age && 
      user.gender && 
      user.location && 
      user.personality?.introvertExtrovert && 
      user.personality?.thinkingFeeling && 
      user.emotionalPatterns?.communicationStyle && 
      user.relationshipPreferences?.relationshipType
    );
    
    // Always set isProfileComplete based on backend calculation, ignore frontend value
    user.isProfileComplete = Boolean(isComplete);
    
    // If password is provided, update it
    if (updateData.password) {
      user.password = updateData.password;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      location: updatedUser.location,
      profilePicture: updatedUser.profilePicture,
      personality: updatedUser.personality,
      emotionalPatterns: updatedUser.emotionalPatterns,
      relationshipPreferences: updatedUser.relationshipPreferences,
      interests: updatedUser.interests,
      bio: updatedUser.bio,
      isProfileComplete: updatedUser.isProfileComplete,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  generateToken,
  getCurrentUser,
  
  // @desc    Forgot password - Generate and send reset token
  // @route   POST /api/auth/forgot-password
  // @access  Public
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      // 1) Get user based on POSTed email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(200).json({
          status: 'success',
          message: 'If an account with that email exists, a reset link has been sent',
        });
      }
      
      // 2) Generate the random reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // 3) Hash token and set to resetPasswordToken field
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // 4) Set token expiration (10 minutes)
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      await user.save({ validateBeforeSave: false });
      
      // 5) Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      // 6) Create email message
      const message = `Forgot your password? Submit a PATCH request with your new password to: \n\n${resetUrl}\n\nIf you didn't forget your password, please ignore this email!`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <p>This link will expire in 10 minutes.</p>
        </div>
      `;
      
      // 7) Send email
      try {
        await sendEmail({
          email: user.email,
          subject: 'Your password reset token (valid for 10 min)',
          message,
          html,
        });
        
        res.status(200).json({
          status: 'success',
          message: 'Token sent to email!',
        });
      } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
        return res.status(500).json({
          status: 'error',
          message: 'There was an error sending the email. Try again later!',
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while processing your request',
      });
    }
  },
  
  // @desc    Verify reset token
  // @route   GET /api/auth/verify-reset-token/:token
  // @access  Public
  verifyResetToken: async (req, res) => {
    try {
      // 1) Get token from URL and hash it
      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
      
      // 2) Find user by token and check expiration
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
      
      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Token is invalid or has expired',
        });
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Token is valid',
      });
    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while verifying the token',
      });
    }
  },
  
  // @desc    Reset password
  // @route   POST /api/auth/reset-password
  // @access  Public
  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // 1) Get user based on the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
      
      // 2) If token has not expired, and there is user, set the new password
      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Token is invalid or has expired',
        });
      }
      
      // 3) Update password and clear reset token fields
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      
      await user.save();
      
      // 4) Log the user in, send JWT
      const authToken = generateToken(user._id);
      
      // Remove password from output
      user.password = undefined;
      
      res.status(200).json({
        status: 'success',
        token: authToken,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while resetting your password',
      });
    }
  },
};