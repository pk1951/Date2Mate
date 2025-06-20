const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth verification
const verifyGoogleToken = async (token) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Invalid Google token');
  }
};

// Facebook OAuth verification
const verifyFacebookToken = async (accessToken) => {
  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v13.0/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    return data;
  } catch (error) {
    console.error('Facebook token verification error:', error);
    throw new Error('Invalid Facebook token');
  }
};

// Common function to handle social user creation/retrieval
const handleSocialUser = async (profile, provider) => {
  const { email, name, picture } = profile;
  
  try {
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name,
        email,
        password: uuidv4(), // Random password
        profilePicture: picture?.data?.url || picture,
        isEmailVerified: true,
        authProvider: provider,
      });
      
      await user.save();
    } else if (user.authProvider !== provider) {
      // User exists but with different provider
      throw new Error(`Please use your ${user.authProvider} account to login`);
    }
    
    // Generate token
    const token = generateToken(user);
    
    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        isProfileComplete: user.isProfileComplete,
      },
    };
  } catch (error) {
    console.error('Social auth error:', error);
    throw error;
  }
};

// Google OAuth login
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }
    
    const googleUser = await verifyGoogleToken(token);
    
    const result = await handleSocialUser({
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    }, 'google');
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ 
      message: error.message || 'Google authentication failed' 
    });
  }
};

// Facebook OAuth login
const facebookLogin = async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ message: 'Facebook access token is required' });
    }
    
    const facebookUser = await verifyFacebookToken(access_token);
    
    const result = await handleSocialUser({
      email: facebookUser.email || `${facebookUser.id}@facebook.com`,
      name: facebookUser.name,
      picture: facebookUser.picture,
    }, 'facebook');
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(401).json({ 
      message: error.message || 'Facebook authentication failed' 
    });
  }
};

module.exports = {
  googleLogin,
  facebookLogin,
};
