const mongoose = require('mongoose');

const userStateSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentState: {
      type: String,
      enum: ['available', 'matched', 'pinned', 'unpinned', 'frozen'],
      default: 'available',
    },
    currentMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    stateStartTime: {
      type: Date,
      default: Date.now,
    },
    stateEndTime: {
      type: Date,
      default: null,
    },
    reflectionPeriodEnd: {
      type: Date,
      default: null,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    milestoneReached: {
      type: Boolean,
      default: false,
    },
    lastFeedback: {
      reason: String,
      details: String,
      receivedAt: Date,
    },
    matchHistory: [
      {
        match: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Match',
        },
        startDate: Date,
        endDate: Date,
        status: {
          type: String,
          enum: ['completed', 'unpinned', 'expired'],
        },
        messageCount: Number,
        milestoneReached: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to transition user to a new state
userStateSchema.methods.transitionTo = async function (newState, matchId = null) {
  // Record end time for current state
  this.stateEndTime = new Date();
  
  // Update state history if there's a current match
  if (this.currentMatch) {
    this.matchHistory.push({
      match: this.currentMatch,
      startDate: this.stateStartTime,
      endDate: this.stateEndTime,
      status: newState === 'unpinned' ? 'unpinned' : 'completed',
      messageCount: this.messageCount,
      milestoneReached: this.milestoneReached,
    });
  }
  
  // Reset state-specific fields
  this.currentState = newState;
  this.stateStartTime = new Date();
  this.stateEndTime = null;
  
  // Handle specific state transitions
  if (newState === 'matched' || newState === 'pinned') {
    this.currentMatch = matchId;
    if (newState === 'matched') {
      this.messageCount = 0;
      this.milestoneReached = false;
    }
  } else if (newState === 'frozen') {
    // Set reflection period end time (24 hours from now)
    this.reflectionPeriodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.currentMatch = null;
  } else if (newState === 'available') {
    this.currentMatch = null;
    this.reflectionPeriodEnd = null;
  }
  
  await this.save();
  return this;
};

// Method to increment message count and check for milestone
userStateSchema.methods.incrementMessageCount = async function () {
  this.messageCount += 1;
  
  // Check if milestone reached (100 messages)
  if (this.messageCount >= 100 && !this.milestoneReached) {
    this.milestoneReached = true;
  }
  
  await this.save();
  return this;
};

// Method to check if user can receive a new match
userStateSchema.methods.canReceiveMatch = function () {
  // User can receive match if they're available
  if (this.currentState === 'available') {
    return true;
  }
  
  // User can receive match if reflection period has ended
  if (this.currentState === 'frozen' && this.reflectionPeriodEnd) {
    return new Date() >= this.reflectionPeriodEnd;
  }
  
  return false;
};

module.exports = mongoose.model('UserState', userStateSchema);