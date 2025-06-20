const Message = require('../models/messageModel');
const Match = require('../models/matchModel');
const UserState = require('../models/userStateModel');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { matchId, content, messageType = 'text', voiceUrl, duration } = req.body;
    const senderId = req.user._id;

    // Validate match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of the match
    if (!match.users.includes(senderId)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this match' });
    }

    // Find the receiver (the other user in the match)
    const receiverId = match.users.find(
      (userId) => userId.toString() !== senderId.toString()
    );

    // Get current message count
    const currentCount = await Message.countDocuments({
      match: matchId,
      contributesToMilestone: true,
    });

    // Create the message
    const message = await Message.create({
      match: matchId,
      sender: senderId,
      receiver: receiverId,
      content,
      messageType,
      voiceUrl,
      duration,
      messageNumber: currentCount + 1,
    });

    // Update match message count
    match.messageCount = currentCount + 1;
    await match.save();

    // Check if milestone reached
    const milestoneReached = await match.checkMilestone();

    // Update user states
    const senderState = await UserState.findOne({ user: senderId });
    await senderState.incrementMessageCount();

    const receiverState = await UserState.findOne({ user: receiverId });
    await receiverState.incrementMessageCount();

    // Return the created message
    res.status(201).json({
      message,
      messageCount: match.messageCount,
      milestoneReached,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages for a match
// @route   GET /api/messages/:matchId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    // Validate match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to view messages in this match' });
    }

    // Get messages
    const messages = await Message.find({ match: matchId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    // Get total message count
    const totalCount = await Message.countDocuments({ match: matchId });

    // Mark messages as read if user is the receiver
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.receiver.toString() === userId.toString()
    );

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(async (msg) => {
          await msg.markAsRead();
        })
      );
    }

    // Get user state for milestone info
    const userState = await UserState.findOne({ user: userId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      totalCount,
      messageCount: match.messageCount,
      milestoneReached: userState.milestoneReached,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:matchId/read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    // Validate match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to access messages in this match' });
    }

    // Mark all unread messages as read where user is the receiver
    const unreadMessages = await Message.find({
      match: matchId,
      receiver: userId,
      isRead: false,
    });

    await Promise.all(
      unreadMessages.map(async (message) => {
        await message.markAsRead();
      })
    );

    res.json({ message: 'Messages marked as read', count: unreadMessages.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get message milestone status
// @route   GET /api/messages/:matchId/milestone
// @access  Private
const getMilestoneStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    // Validate match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to access this match' });
    }

    // Get message count
    const messageCount = await Message.countDocuments({
      match: matchId,
      contributesToMilestone: true,
    });

    // Get user state
    const userState = await UserState.findOne({ user: userId });

    // Calculate time remaining for 48-hour milestone
    const matchStartTime = match.matchDate;
    const currentTime = new Date();
    const elapsedHours = (currentTime - matchStartTime) / (1000 * 60 * 60);
    const remainingHours = Math.max(0, 48 - elapsedHours);

    res.json({
      messageCount,
      targetCount: 100,
      progress: Math.min(100, (messageCount / 100) * 100), // Percentage
      milestoneReached: match.milestoneReached,
      milestoneReachedAt: match.milestoneReachedAt,
      timeRemainingHours: remainingHours,
      canVideoCall: match.milestoneReached,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getMilestoneStatus,
};