const Match = require('../models/matchModel');
const User = require('../models/userModel');
const UserState = require('../models/userStateModel');

// @desc    Generate a daily match for a user
// @route   GET /api/matches/daily
// @access  Private
const getDailyMatch = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user state
    let userState = await UserState.findOne({ user: userId });

    // Check if user already has an active match FIRST
    const existingMatch = await Match.findOne({
      users: userId,
      status: { $in: ['active', 'pinned'] },
    }).populate('users', 'name age gender location profilePicture bio interests');

    if (existingMatch) {
      // Find the other user in the match
      const otherUser = existingMatch.users.find(
        (user) => user._id.toString() !== userId.toString()
      );

      return res.json({
        match: existingMatch,
        matchedUser: otherUser,
      });
    }

    // Only check if user can receive a new match if they don't have an existing match
    if (!userState.canReceiveMatch()) {
      return res.status(400).json({
        message: 'You are not eligible for a new match at this time',
        currentState: userState.currentState,
        reflectionPeriodEnd: userState.reflectionPeriodEnd,
        lastFeedback: userState.lastFeedback,
        stateStartTime: userState.stateStartTime
      });
    }

    // Get current user
    const currentUser = await User.findById(userId);

    // Find potential matches
    // This is a simplified version of the matching algorithm
    // In a real app, this would be more sophisticated
    const potentialMatches = await User.find({
      _id: { $ne: userId },
      isProfileComplete: true,
      // Add gender preference filtering based on user preferences
      // This is a simplified example
      gender: currentUser.gender === 'male' ? 'female' : 'male',
    });

    if (potentialMatches.length === 0) {
      return res.status(404).json({ message: 'No potential matches found' });
    }

    // Find users who are available for matching
    const availableUserIds = potentialMatches.map(user => user._id);
    const availableUserStates = await UserState.find({
      user: { $in: availableUserIds },
      currentState: 'available',
    });

    const availableUsers = potentialMatches.filter(user => 
      availableUserStates.some(state => state.user.toString() === user._id.toString())
    );

    if (availableUsers.length === 0) {
      return res.status(404).json({ message: 'No available matches found' });
    }

    // Calculate compatibility scores
    const scoredMatches = availableUsers.map(user => {
      const compatibilityScore = calculateCompatibility(currentUser, user);
      return { user, compatibilityScore };
    });

    // Sort by compatibility score
    scoredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Select the best match
    const bestMatch = scoredMatches[0];

    // Create a new match
    const newMatch = await Match.create({
      users: [userId, bestMatch.user._id],
      compatibilityScore: bestMatch.compatibilityScore,
      compatibilityFactors: {
        personalityMatch: calculatePersonalityMatch(currentUser, bestMatch.user),
        emotionalMatch: calculateEmotionalMatch(currentUser, bestMatch.user),
        interestMatch: calculateInterestMatch(currentUser, bestMatch.user),
        relationshipGoalsMatch: calculateRelationshipGoalsMatch(currentUser, bestMatch.user),
      },
      status: 'active',
    });

    // Update user states
    await userState.transitionTo('matched', newMatch._id);
    
    const matchedUserState = await UserState.findOne({ user: bestMatch.user._id });
    await matchedUserState.transitionTo('matched', newMatch._id);

    // Return the match
    res.json({
      match: newMatch,
      matchedUser: {
        _id: bestMatch.user._id,
        name: bestMatch.user.name,
        age: bestMatch.user.age,
        gender: bestMatch.user.gender,
        location: bestMatch.user.location,
        profilePicture: bestMatch.user.profilePicture,
        bio: bestMatch.user.bio,
        interests: bestMatch.user.interests,
      },
      compatibilityScore: bestMatch.compatibilityScore,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Pin a match (continue chatting)
// @route   PUT /api/matches/:id/pin
// @access  Private
const pinMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user._id;

    // Find the match
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to access this match' });
    }

    // Update match status
    match.status = 'pinned';
    await match.save();

    // Update user state
    const userState = await UserState.findOne({ user: userId });
    await userState.transitionTo('pinned', matchId);

    res.json({ message: 'Match pinned successfully', match });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Unpin a match (end the match)
// @route   PUT /api/matches/:id/unpin
// @access  Private
const unpinMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user._id;
    const { reason, details } = req.body;

    // Find the match
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to access this match' });
    }

    // Update match
    await match.unpinMatch(userId, reason, details);
    
    // Set the end date for the match
    match.endDate = new Date();
    await match.save();

    // Find the other user in the match
    const otherUserId = match.users.find(
      (id) => id.toString() !== userId.toString()
    );

    // Update user states
    const userState = await UserState.findOne({ user: userId });
    userState.currentState = 'frozen';
    userState.reflectionPeriodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for person who ended
    userState.stateStartTime = new Date();
    userState.currentMatch = null;
    await userState.save();

    const otherUserState = await UserState.findOne({ user: otherUserId });
    
    // Add feedback for the other user (person who got ended on)
    otherUserState.lastFeedback = {
      reason,
      details,
      receivedAt: new Date(),
    };
    
    // Set the other user to frozen state with 2-hour reflection period
    otherUserState.currentState = 'frozen';
    otherUserState.reflectionPeriodEnd = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours for person who got ended on
    otherUserState.stateStartTime = new Date();
    otherUserState.currentMatch = null;
    await otherUserState.save();

    res.json({ 
      message: 'Match unpinned successfully', 
      match,
      reflectionPeriodEnd: userState.reflectionPeriodEnd,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get match details
// @route   GET /api/matches/:id
// @access  Private
const getMatchDetails = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user._id;

    // Find the match with populated users
    const match = await Match.findById(matchId).populate(
      'users',
      'name age gender location profilePicture bio interests'
    );

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of the match
    const isUserInMatch = match.users.some(
      (user) => user._id.toString() === userId.toString()
    );

    if (!isUserInMatch) {
      return res.status(403).json({ message: 'Not authorized to access this match' });
    }

    // Find the other user in the match
    const otherUser = match.users.find(
      (user) => user._id.toString() !== userId.toString()
    );

    // Get user state
    const userState = await UserState.findOne({ user: userId });

    res.json({
      match,
      matchedUser: otherUser,
      currentState: userState.currentState,
      messageCount: userState.messageCount,
      milestoneReached: userState.milestoneReached,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions for compatibility calculation
const calculateCompatibility = (user1, user2) => {
  // This is a simplified version of the compatibility algorithm
  // In a real app, this would be more sophisticated
  const personalityScore = calculatePersonalityMatch(user1, user2);
  const emotionalScore = calculateEmotionalMatch(user1, user2);
  const interestScore = calculateInterestMatch(user1, user2);
  const relationshipScore = calculateRelationshipGoalsMatch(user1, user2);
  
  // Weighted average
  return (
    personalityScore * 0.3 +
    emotionalScore * 0.3 +
    interestScore * 0.2 +
    relationshipScore * 0.2
  );
};

const calculatePersonalityMatch = (user1, user2) => {
  // Check if personality data exists
  if (!user1.personality || !user2.personality) {
    return 50; // Default score
  }
  
  // Calculate difference in personality traits
  const introvertExtrovertDiff = Math.abs(
    (user1.personality.introvertExtrovert || 5) - 
    (user2.personality.introvertExtrovert || 5)
  );
  
  const thinkingFeelingDiff = Math.abs(
    (user1.personality.thinkingFeeling || 5) - 
    (user2.personality.thinkingFeeling || 5)
  );
  
  const planningFlexibilityDiff = Math.abs(
    (user1.personality.planningFlexibility || 5) - 
    (user2.personality.planningFlexibility || 5)
  );
  
  // Convert differences to similarity scores (0-100)
  const introvertExtrovertScore = 100 - (introvertExtrovertDiff * 10);
  const thinkingFeelingScore = 100 - (thinkingFeelingDiff * 10);
  const planningFlexibilityScore = 100 - (planningFlexibilityDiff * 10);
  
  // Average the scores
  return (introvertExtrovertScore + thinkingFeelingScore + planningFlexibilityScore) / 3;
};

const calculateEmotionalMatch = (user1, user2) => {
  // Check if emotional pattern data exists
  if (!user1.emotionalPatterns || !user2.emotionalPatterns) {
    return 50; // Default score
  }
  
  // Communication style compatibility
  const communicationStyleScore = user1.emotionalPatterns.communicationStyle === 
    user2.emotionalPatterns.communicationStyle ? 100 : 50;
  
  // Conflict resolution compatibility
  const conflictResolutionScore = user1.emotionalPatterns.conflictResolution === 
    user2.emotionalPatterns.conflictResolution ? 100 : 50;
  
  // Emotional expression difference
  const expressionDiff = Math.abs(
    (user1.emotionalPatterns.emotionalExpression || 5) - 
    (user2.emotionalPatterns.emotionalExpression || 5)
  );
  
  const expressionScore = 100 - (expressionDiff * 10);
  
  // Average the scores
  return (communicationStyleScore + conflictResolutionScore + expressionScore) / 3;
};

const calculateInterestMatch = (user1, user2) => {
  // Check if interests exist
  if (!user1.interests || !user2.interests || 
      user1.interests.length === 0 || user2.interests.length === 0) {
    return 50; // Default score
  }
  
  // Count common interests
  const user1Interests = new Set(user1.interests);
  const commonInterests = user2.interests.filter(interest => user1Interests.has(interest));
  
  // Calculate percentage of common interests
  const totalUniqueInterests = new Set([...user1.interests, ...user2.interests]).size;
  const commonPercentage = (commonInterests.length / totalUniqueInterests) * 100;
  
  return commonPercentage;
};

const calculateRelationshipGoalsMatch = (user1, user2) => {
  // Check if relationship preferences exist
  if (!user1.relationshipPreferences || !user2.relationshipPreferences) {
    return 50; // Default score
  }
  
  // Relationship type compatibility
  const relationshipTypeScore = user1.relationshipPreferences.relationshipType === 
    user2.relationshipPreferences.relationshipType ? 100 : 50;
  
  // Deal breakers compatibility
  let dealBreakerScore = 100;
  if (user1.relationshipPreferences.dealBreakers && user2.relationshipPreferences.dealBreakers) {
    // Check if any of user2's attributes match user1's deal breakers
    const dealBreakers = new Set(user1.relationshipPreferences.dealBreakers);
    // This is simplified - in a real app, you'd check actual attributes
    dealBreakerScore = 100;
  }
  
  // Important values compatibility
  let valuesScore = 50;
  if (user1.relationshipPreferences.importantValues && user2.relationshipPreferences.importantValues) {
    const user1Values = new Set(user1.relationshipPreferences.importantValues);
    const commonValues = user2.relationshipPreferences.importantValues.filter(value => 
      user1Values.has(value)
    );
    
    valuesScore = (commonValues.length / user1.relationshipPreferences.importantValues.length) * 100;
  }
  
  // Average the scores
  return (relationshipTypeScore + dealBreakerScore + valuesScore) / 3;
};

module.exports = {
  getDailyMatch,
  pinMatch,
  unpinMatch,
  getMatchDetails,
};