const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const UserState = require('../models/userStateModel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/date2mate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestUsers = async () => {
  try {
    // Clear existing test users
    await User.deleteMany({ email: { $regex: /test\d+@example\.com$/ } });
    await UserState.deleteMany({});

    const testUsers = [
      {
        name: 'Sarah Johnson',
        email: 'test1@example.com',
        password: 'password123',
        age: 25,
        gender: 'female',
        location: {
          placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          mainText: 'Sydney',
          secondaryText: 'NSW, Australia'
        },
        bio: 'Adventure seeker and coffee enthusiast. Looking for someone to explore the world with!',
        interests: ['travel', 'photography', 'hiking', 'cooking'],
        personality: {
          openness: 8,
          conscientiousness: 7,
          extraversion: 6,
          agreeableness: 8,
          neuroticism: 3
        },
        preferences: {
          ageRange: { min: 23, max: 30 },
          distance: 50,
          interests: ['travel', 'music', 'sports']
        }
      },
      {
        name: 'Michael Chen',
        email: 'test2@example.com',
        password: 'password123',
        age: 28,
        gender: 'male',
        location: {
          placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          mainText: 'Sydney',
          secondaryText: 'NSW, Australia'
        },
        bio: 'Software engineer by day, musician by night. Love playing guitar and discovering new music.',
        interests: ['music', 'technology', 'gaming', 'cooking'],
        personality: {
          openness: 7,
          conscientiousness: 8,
          extraversion: 5,
          agreeableness: 7,
          neuroticism: 4
        },
        preferences: {
          ageRange: { min: 24, max: 32 },
          distance: 50,
          interests: ['music', 'technology', 'travel']
        }
      },
      {
        name: 'Emma Wilson',
        email: 'test3@example.com',
        password: 'password123',
        age: 26,
        gender: 'female',
        location: {
          placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          mainText: 'Sydney',
          secondaryText: 'NSW, Australia'
        },
        bio: 'Yoga instructor and wellness advocate. Passionate about healthy living and mindfulness.',
        interests: ['yoga', 'meditation', 'healthy-living', 'reading'],
        personality: {
          openness: 6,
          conscientiousness: 9,
          extraversion: 4,
          agreeableness: 9,
          neuroticism: 2
        },
        preferences: {
          ageRange: { min: 24, max: 30 },
          distance: 50,
          interests: ['health', 'mindfulness', 'nature']
        }
      },
      {
        name: 'David Rodriguez',
        email: 'test4@example.com',
        password: 'password123',
        age: 29,
        gender: 'male',
        location: {
          placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          mainText: 'Sydney',
          secondaryText: 'NSW, Australia'
        },
        bio: 'Chef and food lover. Always experimenting with new recipes and cuisines.',
        interests: ['cooking', 'food', 'travel', 'sports'],
        personality: {
          openness: 8,
          conscientiousness: 6,
          extraversion: 7,
          agreeableness: 6,
          neuroticism: 5
        },
        preferences: {
          ageRange: { min: 25, max: 33 },
          distance: 50,
          interests: ['food', 'travel', 'sports']
        }
      }
    ];

    console.log('Creating test users...');

    for (const userData of testUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword,
        isProfileComplete: true,
        isVerified: true
      });

      await user.save();

      // Create user state
      const userState = new UserState({
        userId: user._id,
        lastActive: new Date(),
        isOnline: false,
        currentMatch: null,
        dailyMatchGenerated: false,
        lastMatchDate: null,
        reflectionPeriod: {
          isActive: false,
          startDate: null,
          endDate: null
        }
      });

      await userState.save();

      console.log(`Created user: ${userData.name} (${userData.email})`);
    }

    console.log('\n✅ Test users created successfully!');
    console.log('\nTest Accounts:');
    console.log('1. Sarah Johnson - test1@example.com / password123');
    console.log('2. Michael Chen - test2@example.com / password123');
    console.log('3. Emma Wilson - test3@example.com / password123');
    console.log('4. David Rodriguez - test4@example.com / password123');
    console.log('\nThese users are compatible and should match with each other!');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestUsers(); 