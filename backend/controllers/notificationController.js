const UserState = require('../models/userStateModel');
const Match = require('../models/matchModel');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user state to check for feedback and reflection periods
    const userState = await UserState.findOne({ user: userId });
    
    const notifications = [];
    let unreadCount = 0;

    // Only proceed if userState exists
    if (userState) {
      // Check if user has received feedback from a recent match ending (person who got ended on)
      if (userState.lastFeedback && userState.lastFeedback.receivedAt) {
        const feedbackNotification = {
          id: 'feedback_' + userState.lastFeedback.receivedAt.getTime(),
          type: 'feedback',
          message: `Your match ended. Reason: ${userState.lastFeedback.reason}`,
          details: userState.lastFeedback.details,
          time: formatTimeAgo(userState.lastFeedback.receivedAt),
          read: false,
          timestamp: userState.lastFeedback.receivedAt
        };
        
        notifications.push(feedbackNotification);
        unreadCount++;
      }

      // Check if user is in reflection period - different messages for different users
      if (userState.currentState === 'frozen' && userState.reflectionPeriodEnd && userState.stateStartTime) {
        // Check if this user has feedback (person who got ended on) or not (person who ended)
        const hasFeedback = userState.lastFeedback && userState.lastFeedback.receivedAt;
        
        const reflectionNotification = {
          id: 'reflection_' + userState.stateStartTime.getTime(),
          type: 'reflection',
          message: hasFeedback 
            ? 'Take time to reflect on the feedback you received'
            : 'Take time to reflect on your decision to end the match',
          details: hasFeedback 
            ? 'Consider what you can learn from this experience and how you can grow'
            : 'Reflect on what you learned about yourself and what you\'re looking for',
          time: formatTimeAgo(userState.stateStartTime),
          read: false,
          timestamp: userState.stateStartTime
        };
        
        notifications.push(reflectionNotification);
        unreadCount++;
      }

      // Check if user has milestone achievements
      if (userState.milestoneReached && userState.stateStartTime) {
        const milestoneNotification = {
          id: 'milestone_' + userState.stateStartTime.getTime(),
          type: 'milestone',
          message: 'Congratulations! You reached the 100 message milestone',
          details: 'You can now make video calls with your match',
          time: formatTimeAgo(userState.stateStartTime),
          read: false,
          timestamp: userState.stateStartTime
        };
        
        notifications.push(milestoneNotification);
        unreadCount++;
      }
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

// @desc    Get chat activity data for user's most recent ended match
// @route   GET /api/notifications/activity
// @access  Private
const getChatActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user state to find the most recent match
    const userState = await UserState.findOne({ user: userId });
    if (!userState || !userState.stateStartTime) {
      return res.status(404).json({ message: 'No recent match found' });
    }

    // Find the most recent match for this user that has ended
    const Match = require('../models/matchModel');
    const recentMatch = await Match.findOne({
      users: userId,
      status: 'ended',
      endDate: { $exists: true, $ne: null }
    }).sort({ endDate: -1 });

    if (!recentMatch) {
      // If no ended match found, try to find any recent match
      const anyMatch = await Match.findOne({
        users: userId
      }).sort({ createdAt: -1 });

      if (!anyMatch) {
        return res.status(404).json({ message: 'No match found' });
      }

      // Use the current match if no ended match exists
      const Message = require('../models/messageModel');
      const messages = await Message.find({ match: anyMatch._id })
        .sort({ createdAt: 1 })
        .select('createdAt');

      const activityData = generateHourlyActivity(messages, anyMatch.matchDate);

      return res.json({
        activityData,
        totalMessages: messages.length,
        matchDuration: Math.ceil((new Date() - anyMatch.matchDate) / (1000 * 60 * 60)),
        matchStartTime: anyMatch.matchDate,
        matchEndTime: new Date()
      });
    }

    // Get messages for this match
    const Message = require('../models/messageModel');
    const messages = await Message.find({ match: recentMatch._id })
      .sort({ createdAt: 1 })
      .select('createdAt');

    // Generate hourly activity data
    const activityData = generateHourlyActivity(messages, recentMatch.matchDate);

    res.json({
      activityData,
      totalMessages: messages.length,
      matchDuration: Math.ceil((recentMatch.endDate - recentMatch.matchDate) / (1000 * 60 * 60)),
      matchStartTime: recentMatch.matchDate,
      matchEndTime: recentMatch.endDate
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to generate hourly activity data
const generateHourlyActivity = (messages, matchStartTime) => {
  const hours = 24;
  const activityData = [];
  
  // If no messages, return empty activity data
  if (!messages || messages.length === 0) {
    for (let i = 0; i < hours; i++) {
      const hourStart = new Date(matchStartTime);
      hourStart.setHours(hourStart.getHours() + i);
      
      activityData.push({
        hour: hourStart.getHours(),
        activity: 0,
        timeLabel: `${hourStart.getHours()}:00`
      });
    }
    return activityData;
  }
  
  for (let i = 0; i < hours; i++) {
    const hourStart = new Date(matchStartTime);
    hourStart.setHours(hourStart.getHours() + i);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);
    
    // Count messages in this hour
    const messagesInHour = messages.filter(msg => {
      const msgTime = new Date(msg.createdAt);
      return msgTime >= hourStart && msgTime < hourEnd;
    }).length;
    
    activityData.push({
      hour: hourStart.getHours(),
      activity: messagesInHour,
      timeLabel: `${hourStart.getHours()}:00`
    });
  }
  
  return activityData;
};

module.exports = {
  getNotifications,
  getChatActivity
}; 