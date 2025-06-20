const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    password: {
      type: String,
      required: function() { return !this.authProvider; }, // Not required for social logins
      minlength: 6,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['google', 'facebook', null],
      default: null,
    },
    providerId: {
      type: String,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      required: [true, 'Please add your age'],
    },
    gender: {
      type: String,
      required: [true, 'Please specify your gender'],
      enum: ['male', 'female', 'non-binary', 'other'],
    },
    location: {
      type: String,
      required: [true, 'Please add your location'],
    },
    // Personality traits
    personality: {
      introvertExtrovert: { type: Number, min: 1, max: 10 }, // 1: Very introverted, 10: Very extroverted
      thinkingFeeling: { type: Number, min: 1, max: 10 }, // 1: Very logical, 10: Very emotional
      planningFlexibility: { type: Number, min: 1, max: 10 }, // 1: Very structured, 10: Very spontaneous
      stressManagement: { type: Number, min: 1, max: 10 }, // 1: Poor stress management, 10: Excellent stress management
    },
    // Emotional patterns
    emotionalPatterns: {
      communicationStyle: { type: String, enum: ['direct', 'indirect', 'analytical', 'intuitive', 'functional'] },
      conflictResolution: { type: String, enum: ['compromising', 'accommodating', 'competing', 'avoiding', 'collaborating'] },
      emotionalExpression: { type: Number, min: 1, max: 10 }, // 1: Reserved, 10: Very expressive
    },
    // Relationship preferences
    relationshipPreferences: {
      relationshipType: { type: String, enum: ['casual', 'serious', 'marriage-minded', 'undecided'] },
      dealBreakers: [String],
      importantValues: [String],
    },
    interests: [String],
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);