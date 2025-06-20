const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const UserState = require('../models/userStateModel');
const db = require('../config/db');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/date2mate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createPraveenYashna() {
  try {
    console.log('Creating Praveen Kumar and Yashna test users...');
    
    // Connect to database only if not already connected
    if (mongoose.connection.readyState === 0) {
      await db();
    }
    
    // Create Praveen Kumar
    const praveen = new User({
      name: 'Praveen Kumar',
      email: 'praveen@test.com',
      password: 'password123',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      age: 22,
      gender: 'male',
      location: 'Bangalore, Karnataka, India',
      bio: 'B.Tech CSE student at PES University. Passionate about technology and creating meaningful connections. Love coding, music, and exploring new places. Looking for someone who shares similar values and goals.',
      interests: ['technology', 'coding', 'music', 'travel', 'reading', 'gaming'],
      personality: {
        introvertExtrovert: 7,
        thinkingFeeling: 6,
        planningFlexibility: 8,
        stressManagement: 7,
      },
      emotionalPatterns: {
        communicationStyle: 'direct',
        conflictResolution: 'collaborating',
        emotionalExpression: 7,
      },
      relationshipPreferences: {
        relationshipType: 'serious',
        dealBreakers: ['dishonesty', 'lack of ambition', 'poor communication'],
        importantValues: ['honesty', 'ambition', 'communication', 'respect'],
      },
      isProfileComplete: true,
    });

    // Create Yashna
    const yashna = new User({
      name: 'Yashna',
      email: 'yashna@test.com',
      password: 'password123',
      profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      age: 21,
      gender: 'female',
      location: 'Bangalore, Karnataka, India',
      bio: 'Computer Science student who loves technology and innovation. Passionate about coding, music, and exploring new cultures. Looking for someone who is ambitious, kind, and shares similar interests.',
      interests: ['technology', 'coding', 'music', 'travel', 'reading', 'photography'],
      personality: {
        introvertExtrovert: 6,
        thinkingFeeling: 7,
        planningFlexibility: 7,
        stressManagement: 8,
      },
      emotionalPatterns: {
        communicationStyle: 'analytical',
        conflictResolution: 'compromising',
        emotionalExpression: 6,
      },
      relationshipPreferences: {
        relationshipType: 'serious',
        dealBreakers: ['dishonesty', 'lack of respect', 'poor communication'],
        importantValues: ['honesty', 'respect', 'communication', 'ambition'],
      },
      isProfileComplete: true,
    });

    // Save users first
    const savedPraveen = await praveen.save();
    const savedYashna = await yashna.save();

    console.log('Users created successfully!');
    console.log('Praveen Kumar ID:', savedPraveen._id);
    console.log('Yashna ID:', savedYashna._id);

    // Create UserState for Praveen
    const praveenState = new UserState({
      user: savedPraveen._id,
      currentState: 'available',
    });

    // Create UserState for Yashna
    const yashnaState = new UserState({
      user: savedYashna._id,
      currentState: 'available',
    });

    // Save UserStates
    await praveenState.save();
    await yashnaState.save();

    console.log('UserStates created successfully!');
    console.log('Test users are ready for matching!');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error creating users:', error);
    await mongoose.connection.close();
  }
}

createPraveenYashna(); 