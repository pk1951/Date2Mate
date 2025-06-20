const mongoose = require('mongoose');

const matchSchema = mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    matchDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'pinned', 'unpinned', 'expired', 'ended'],
      default: 'active',
    },
    compatibilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    compatibilityFactors: {
      personalityMatch: { type: Number, min: 0, max: 100 },
      emotionalMatch: { type: Number, min: 0, max: 100 },
      interestMatch: { type: Number, min: 0, max: 100 },
      relationshipGoalsMatch: { type: Number, min: 0, max: 100 },
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    milestoneReached: {
      type: Boolean,
      default: false,
    },
    milestoneReachedAt: {
      type: Date,
      default: null,
    },
    unpinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    unpinReason: {
      type: String,
      enum: ['not_compatible', 'no_chemistry', 'communication_issues', 'different_goals', 'other'],
      default: null,
    },
    unpinDetails: {
      type: String,
      default: '',
    },
    feedbackProvided: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        feedback: String,
        providedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to check if match has reached the message milestone
matchSchema.methods.checkMilestone = async function () {
  if (this.messageCount >= 100 && !this.milestoneReached) {
    this.milestoneReached = true;
    this.milestoneReachedAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Method to unpin a match
matchSchema.methods.unpinMatch = async function (userId, reason, details = '') {
  this.status = 'ended';
  this.unpinnedBy = userId;
  this.unpinReason = reason;
  this.unpinDetails = details;
  await this.save();
  return this;
};

// Method to add feedback for a match
matchSchema.methods.addFeedback = async function (userId, feedback) {
  this.feedbackProvided.push({
    user: userId,
    feedback,
    providedAt: new Date(),
  });
  await this.save();
  return this;
};

module.exports = mongoose.model('Match', matchSchema);