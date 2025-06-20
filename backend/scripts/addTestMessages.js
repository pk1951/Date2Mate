const mongoose = require('mongoose');
const Message = require('../models/messageModel');
const Match = require('../models/matchModel');
const User = require('../models/userModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const addTestMessages = async () => {
  try {
    // Find Praveen and Yashna
    const praveen = await User.findOne({ email: 'praveen@example.com' });
    const yashna = await User.findOne({ email: 'yashna@example.com' });
    
    if (!praveen || !yashna) {
      console.log('Users not found. Please run createPraveenYashna.js first.');
      return;
    }

    // Find their match
    const match = await Match.findOne({
      users: { $all: [praveen._id, yashna._id] }
    }).sort({ createdAt: -1 });

    if (!match) {
      console.log('No match found between Praveen and Yashna.');
      return;
    }

    console.log('Found match:', match._id);

    // Create test messages over the last 24 hours
    const now = new Date();
    const messages = [];

    // Generate messages for the last 24 hours
    for (let i = 23; i >= 0; i--) {
      const messageTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      // More messages in evening hours (6 PM - 11 PM)
      let messageCount = 0;
      const hour = messageTime.getHours();
      
      if (hour >= 18 || hour <= 2) {
        // Evening/night hours - 3-8 messages per hour
        messageCount = Math.floor(Math.random() * 6) + 3;
      } else if (hour >= 12 && hour <= 17) {
        // Afternoon hours - 1-4 messages per hour
        messageCount = Math.floor(Math.random() * 4) + 1;
      } else {
        // Morning hours - 0-2 messages per hour
        messageCount = Math.floor(Math.random() * 3);
      }

      // Create messages for this hour
      for (let j = 0; j < messageCount; j++) {
        const messageOffset = Math.floor(Math.random() * 60 * 60 * 1000);
        const messageTimeWithOffset = new Date(messageTime.getTime() + messageOffset);
        
        const sender = j % 2 === 0 ? praveen._id : yashna._id;
        const messageTexts = [
          "Hey! How's your day going?",
          "That sounds great!",
          "I love that movie too!",
          "What are your plans for the weekend?",
          "That's really interesting!",
          "I feel the same way about that",
          "Thanks for sharing that with me",
          "You seem really thoughtful",
          "I'd love to hear more about that",
          "That's a great perspective!"
        ];

        messages.push({
          match: match._id,
          sender: sender,
          content: messageTexts[Math.floor(Math.random() * messageTexts.length)],
          createdAt: messageTimeWithOffset
        });
      }
    }

    // Insert all messages
    await Message.insertMany(messages);
    
    console.log(`Created ${messages.length} test messages for match ${match._id}`);
    
    // Update match message count
    match.messageCount = messages.length;
    await match.save();
    
    console.log('Test messages created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test messages:', error);
    process.exit(1);
  }
};

addTestMessages(); 