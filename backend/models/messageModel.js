const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    messageNumber: {
      type: Number,
      required: true,
    },
    // For tracking milestone progress
    contributesToMilestone: {
      type: Boolean,
      default: true,
    },
    // For potential future voice message feature
    messageType: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    voiceUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // in seconds, for voice messages
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method to mark message as read
messageSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Static method to get message count for a match
messageSchema.statics.getMessageCount = async function (matchId) {
  const count = await this.countDocuments({
    match: matchId,
    contributesToMilestone: true,
  });
  return count;
};

// Static method to check if milestone reached
messageSchema.statics.checkMilestoneReached = async function (matchId) {
  const count = await this.getMessageCount(matchId);
  return count >= 100;
};

// Static method to get all messages for a match
messageSchema.statics.getMatchMessages = async function (matchId, limit = 50, skip = 0) {
  const messages = await this.find({ match: matchId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture');
  
  return messages;
};

module.exports = mongoose.model('Message', messageSchema);