const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');
const UserState = require('./models/userStateModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/date2mate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testUsers = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@test.com',
    password: 'password123',
    age: 25,
    gender: 'female',
    location: 'Bangalore, India',
    bio: 'I love reading books, hiking, and trying new restaurants. Looking for someone who shares my passion for adventure and good conversation.',
    interests: ['Reading', 'Hiking', 'Cooking', 'Travel', 'Photography'],
    personality: {
      introvertExtrovert: 3,
      thinkingFeeling: 4,
      planningFlexibility: 2
    },
    emotionalPatterns: {
      communicationStyle: 4,
      conflictResolution: 3,
      expression: 5
    },
    relationshipGoals: {
      relationshipType: 'serious',
      dealBreakers: ['dishonesty', 'lack of ambition'],
      values: ['honesty', 'kindness', 'ambition']
    },
    isProfileComplete: true
  },
  {
    name: 'Emma Davis',
    email: 'emma@test.com',
    password: 'password123',
    age: 28,
    gender: 'female',
    location: 'Mumbai, India',
    bio: 'Software engineer by day, artist by night. I enjoy painting, yoga, and exploring new places. Looking for someone who values creativity and personal growth.',
    interests: ['Art', 'Yoga', 'Technology', 'Travel', 'Music'],
    personality: {
      introvertExtrovert: 2,
      thinkingFeeling: 5,
      planningFlexibility: 4
    },
    emotionalPatterns: {
      communicationStyle: 3,
      conflictResolution: 4,
      expression: 4
    },
    relationshipGoals: {
      relationshipType: 'serious',
      dealBreakers: ['lack of respect', 'closed-mindedness'],
      values: ['creativity', 'respect', 'growth']
    },
    isProfileComplete: true
  },
  {
    name: 'Lisa Chen',
    email: 'lisa@test.com',
    password: 'password123',
    age: 26,
    gender: 'female',
    location: 'Delhi, India',
    bio: 'Passionate about fitness and healthy living. I enjoy running, cooking healthy meals, and spending time with friends. Looking for someone who shares my active lifestyle.',
    interests: ['Fitness', 'Cooking', 'Running', 'Health', 'Friends'],
    personality: {
      introvertExtrovert: 4,
      thinkingFeeling: 3,
      planningFlexibility: 3
    },
    emotionalPatterns: {
      communicationStyle: 5,
      conflictResolution: 4,
      expression: 3
    },
    relationshipGoals: {
      relationshipType: 'serious',
      dealBreakers: ['unhealthy lifestyle', 'lack of motivation'],
      values: ['health', 'motivation', 'support']
    },
    isProfileComplete: true
  },
  {
    name: 'Mike Wilson',
    email: 'mike@test.com',
    password: 'password123',
    age: 27,
    gender: 'male',
    location: 'Bangalore, India',
    bio: 'Tech enthusiast and coffee lover. I enjoy coding, playing guitar, and exploring new coffee shops. Looking for someone who appreciates both technology and simple pleasures.',
    interests: ['Technology', 'Music', 'Coffee', 'Coding', 'Guitar'],
    personality: {
      introvertExtrovert: 3,
      thinkingFeeling: 2,
      planningFlexibility: 4
    },
    emotionalPatterns: {
      communicationStyle: 3,
      conflictResolution: 4,
      expression: 3
    },
    relationshipGoals: {
      relationshipType: 'serious',
      dealBreakers: ['lack of communication', 'dishonesty'],
      values: ['honesty', 'communication', 'passion']
    },
    isProfileComplete: true
  },
  {
    name: 'David Brown',
    email: 'david@test.com',
    password: 'password123',
    age: 29,
    gender: 'male',
    location: 'Mumbai, India',
    bio: 'Adventure seeker and nature lover. I enjoy rock climbing, camping, and photography. Looking for someone who shares my love for outdoor adventures.',
    interests: ['Rock Climbing', 'Camping', 'Photography', 'Adventure', 'Nature'],
    personality: {
      introvertExtrovert: 4,
      thinkingFeeling: 3,
      planningFlexibility: 5
    },
    emotionalPatterns: {
      communicationStyle: 4,
      conflictResolution: 3,
      expression: 4
    },
    relationshipGoals: {
      relationshipType: 'serious',
      dealBreakers: ['fear of adventure', 'lack of spontaneity'],
      values: ['adventure', 'spontaneity', 'nature']
    },
    isProfileComplete: true
  },
  {
    name: 'John Smith',
    email: 'john@test.com',
    password: 'password123',
    age: 26,
    gender: 'male',
    location: 'Delhi, India',
    bio: 'Bookworm and introvert who loves deep conversations. I enjoy reading, writing, and quiet evenings. Looking for someone who appreciates intellectual discussions.',
    interests: ['Reading', 'Writing', 'Philosophy', 'Quiet Time', 'Deep Conversations'],
    personality: {
      introvertExtrovert: 2,
      thinkingFeeling: 4,
      planningFlexibility: 2
    },
    emotionalPatterns: {
      communicationStyle: 4,
      conflictResolution: 5,
      expression: 3
    },
    relationshipGoals: {
      relationshipType: 'serious',
      dealBreakers: ['superficiality', 'lack of depth'],
      values: ['intelligence', 'depth', 'understanding']
    },
    isProfileComplete: true
  }
];

const createTestUsers = async () => {
  try {
    console.log('Creating test users...');
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();

      // Create user state
      const userState = new UserState({
        user: user._id,
        currentState: 'available',
        lastMatchDate: null,
        reflectionPeriodEnd: null,
        activeMatch: null
      });

      await userState.save();

      console.log(`Created user: ${userData.name} (${userData.email})`);
    }

    console.log('Test users created successfully!');
    console.log('\nTest user credentials:');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}, Password: ${user.password}`);
    });

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestUsers(); 