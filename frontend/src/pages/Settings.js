import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile picture upload state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    location: '',
    bio: '',
    profilePicture: '',
    interests: [],
    personality: {
      introvertExtrovert: 5,
      thinkingFeeling: 5,
      planningFlexibility: 5,
      stressManagement: 5,
    },
    emotionalPatterns: {
      communicationStyle: 'direct',
      conflictResolution: 'compromising',
      emotionalExpression: 5,
    },
    relationshipPreferences: {
      relationshipType: 'serious',
      dealBreakers: [],
      importantValues: [],
    },
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    newMatches: true,
    messages: true,
    milestones: true,
    reflectionReminders: true,
  });

  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      setFormData({
        name: data.name || '',
        email: data.email || '',
        age: data.age || '',
        gender: data.gender || '',
        location: data.location || '',
        bio: data.bio || '',
        profilePicture: data.profilePicture || '',
        interests: data.interests || [],
        personality: data.personality || {
          introvertExtrovert: 5,
          thinkingFeeling: 5,
          planningFlexibility: 5,
          stressManagement: 5,
        },
        emotionalPatterns: data.emotionalPatterns || {
          communicationStyle: 'direct',
          conflictResolution: 'compromising',
          emotionalExpression: 5,
        },
        relationshipPreferences: data.relationshipPreferences || {
          relationshipType: 'serious',
          dealBreakers: [],
          importantValues: [],
        },
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePersonalityChange = (trait, value) => {
    setFormData(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [trait]: parseInt(value),
      },
    }));
  };

  const handleEmotionalPatternsChange = (pattern, value) => {
    setFormData(prev => ({
      ...prev,
      emotionalPatterns: {
        ...prev.emotionalPatterns,
        [pattern]: value,
      },
    }));
  };

  const handleRelationshipPreferencesChange = (preference, value) => {
    setFormData(prev => ({
      ...prev,
      relationshipPreferences: {
        ...prev.relationshipPreferences,
        [preference]: value,
      },
    }));
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setProfilePicture(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async () => {
    if (!profilePicture) return null;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      const response = await fetch('http://localhost:5000/api/upload/profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload profile picture');
      }

      return data.profilePicture;
    } catch (error) {
      setError(error.message);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // Upload profile picture first if selected
      let profilePicturePath = null;
      if (profilePicture) {
        profilePicturePath = await uploadProfilePicture();
        if (!profilePicturePath) {
          setSaving(false);
          return;
        }
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          profilePicture: profilePicturePath || formData.profilePicture,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      
      // Clear upload state
      setProfilePicture(null);
      setProfilePicturePreview('');
      
      // Update user info in localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      localStorage.setItem('userInfo', JSON.stringify({
        ...userInfo,
        name: data.name,
        isProfileComplete: data.isProfileComplete,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      alert('Account deletion feature coming soon.');
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-content">
        {/* Profile Settings */}
        <div className="settings-section">
          <h2>Profile Settings</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="100"
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                required
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                maxLength="500"
                placeholder="Tell us about yourself..."
                rows="4"
              />
              <small>{formData.bio.length}/500 characters</small>
            </div>

            <div className="form-group">
              <label>Profile Picture URL</label>
              <input
                type="url"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Profile Image Display */}
            <div className="form-group">
              <label>Current Profile Picture</label>
              <div className="profile-image-display">
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile preview" 
                    className="profile-image"
                  />
                ) : formData.profilePicture ? (
                  <img 
                    src={formData.profilePicture.startsWith('http') ? formData.profilePicture : `http://localhost:5000${formData.profilePicture}`} 
                    alt="Profile" 
                    className="profile-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                {(!formData.profilePicture || formData.profilePicture === '') && !profilePicturePreview && (
                  <div className="profile-image-placeholder">
                    <span>No profile picture</span>
                  </div>
                )}
              </div>
              
              {/* File Upload Section */}
              <div className="upload-section">
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="file-input"
                />
                <label htmlFor="profilePicture" className="upload-button">
                  📷 Upload New Picture
                </label>
                <small>Max size: 5MB. Supported formats: JPG, PNG, GIF</small>
              </div>
            </div>

            {/* Personality Assessment */}
            <div className="form-section">
              <h3>Personality Assessment</h3>
              
              <div className="slider-group">
                <label>Introvert vs Extrovert</label>
                <div className="slider-container">
                  <span>Introvert</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.personality.introvertExtrovert}
                    onChange={(e) => handlePersonalityChange('introvertExtrovert', e.target.value)}
                  />
                  <span>Extrovert</span>
                </div>
                <small>Current: {formData.personality.introvertExtrovert}/10</small>
              </div>

              <div className="slider-group">
                <label>Logical vs Emotional</label>
                <div className="slider-container">
                  <span>Logical</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.personality.thinkingFeeling}
                    onChange={(e) => handlePersonalityChange('thinkingFeeling', e.target.value)}
                  />
                  <span>Emotional</span>
                </div>
                <small>Current: {formData.personality.thinkingFeeling}/10</small>
              </div>

              <div className="slider-group">
                <label>Structured vs Spontaneous</label>
                <div className="slider-container">
                  <span>Structured</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.personality.planningFlexibility}
                    onChange={(e) => handlePersonalityChange('planningFlexibility', e.target.value)}
                  />
                  <span>Spontaneous</span>
                </div>
                <small>Current: {formData.personality.planningFlexibility}/10</small>
              </div>

              <div className="slider-group">
                <label>Stress Management</label>
                <div className="slider-container">
                  <span>Poor</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.personality.stressManagement}
                    onChange={(e) => handlePersonalityChange('stressManagement', e.target.value)}
                  />
                  <span>Excellent</span>
                </div>
                <small>Current: {formData.personality.stressManagement}/10</small>
              </div>
            </div>

            {/* Emotional Patterns */}
            <div className="form-section">
              <h3>Communication & Emotional Patterns</h3>
              
              <div className="form-group">
                <label>Communication Style</label>
                <select
                  value={formData.emotionalPatterns.communicationStyle}
                  onChange={(e) => handleEmotionalPatternsChange('communicationStyle', e.target.value)}
                >
                  <option value="direct">Direct</option>
                  <option value="indirect">Indirect</option>
                  <option value="analytical">Analytical</option>
                  <option value="intuitive">Intuitive</option>
                  <option value="functional">Functional</option>
                </select>
              </div>

              <div className="form-group">
                <label>Conflict Resolution Style</label>
                <select
                  value={formData.emotionalPatterns.conflictResolution}
                  onChange={(e) => handleEmotionalPatternsChange('conflictResolution', e.target.value)}
                >
                  <option value="compromising">Compromising</option>
                  <option value="accommodating">Accommodating</option>
                  <option value="competing">Competing</option>
                  <option value="avoiding">Avoiding</option>
                  <option value="collaborating">Collaborating</option>
                </select>
              </div>

              <div className="slider-group">
                <label>Emotional Expression</label>
                <div className="slider-container">
                  <span>Reserved</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.emotionalPatterns.emotionalExpression}
                    onChange={(e) => handleEmotionalPatternsChange('emotionalExpression', e.target.value)}
                  />
                  <span>Very Expressive</span>
                </div>
                <small>Current: {formData.emotionalPatterns.emotionalExpression}/10</small>
              </div>
            </div>

            {/* Relationship Preferences */}
            <div className="form-section">
              <h3>Relationship Preferences</h3>
              
              <div className="form-group">
                <label>Relationship Type</label>
                <select
                  value={formData.relationshipPreferences.relationshipType}
                  onChange={(e) => handleRelationshipPreferencesChange('relationshipType', e.target.value)}
                >
                  <option value="casual">Casual</option>
                  <option value="serious">Serious</option>
                  <option value="marriage-minded">Marriage-minded</option>
                  <option value="undecided">Undecided</option>
                </select>
              </div>

              <div className="form-group">
                <label>Interests (Select all that apply)</label>
                <div className="checkbox-group">
                  {['Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Art', 'Technology', 'Nature', 'Fitness', 'Movies', 'Photography', 'Dancing'].map(interest => (
                    <label key={interest} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestChange(interest)}
                      />
                      {interest}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <h2>Notification Settings</h2>
          <div className="notification-settings">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <label key={key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleNotificationChange(key)}
                />
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="settings-section">
          <h2>Account Actions</h2>
          <div className="account-actions">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
            <button onClick={handleDeleteAccount} className="delete-button">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 