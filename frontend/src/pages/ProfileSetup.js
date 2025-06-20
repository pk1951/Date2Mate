import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, authAPI } from '../services/api';
import '../styles/ProfileSetup.css';

const ProfileSetup = () => {
  console.log('ProfileSetup component rendering...'); // Debug log
  
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState({
    // Basic info
    location: '',
    bio: '',
    
    // Personality traits
    personality: {
      introvertExtrovert: 5, // 1: Very introverted, 10: Very extroverted
      thinkingFeeling: 5, // 1: Very logical, 10: Very emotional
      planningFlexibility: 5, // 1: Very structured, 10: Very spontaneous
      stressManagement: 5, // 1: Poor stress management, 10: Excellent stress management
    },
    
    // Emotional patterns
    emotionalPatterns: {
      communicationStyle: '',
      conflictResolution: '',
      emotionalExpression: 5, // 1: Reserved, 10: Very expressive
    },
    
    // Relationship preferences
    relationshipPreferences: {
      relationshipType: '',
      dealBreakers: [],
      importantValues: [],
    },
    
    // Interests
    interests: [],
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  
  // Get token from localStorage
  useEffect(() => {
    console.log('ProfileSetup useEffect running...'); // Debug log
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Handle input changes for basic fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle changes for nested objects
  const handleNestedChange = (category, field, value) => {
    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [field]: value,
      },
    });
  };
  
  // Handle slider changes
  const handleSliderChange = (category, field, value) => {
    handleNestedChange(category, field, parseInt(value));
  };
  
  // Handle array fields (interests, dealBreakers, importantValues)
  const handleArrayChange = (field, value) => {
    // Split by commas and trim whitespace
    const arrayValues = value.split(',').map(item => item.trim());
    
    if (field === 'interests') {
      setFormData({
        ...formData,
        interests: arrayValues,
      });
    } else {
      setFormData({
        ...formData,
        relationshipPreferences: {
          ...formData.relationshipPreferences,
          [field]: arrayValues,
        },
      });
    }
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
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };
  
  // Upload profile picture
  const uploadProfilePicture = async () => {
    if (!profilePicture) return null;

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);
      
      console.log('Uploading profile picture...');
      const data = await uploadAPI.uploadProfilePicture(formData);
      console.log('Profile picture uploaded successfully:', data);
      
      if (!data || !data.profilePicture) {
        throw new Error('Failed to upload profile picture: Invalid response from server');
      }
      
      return data.profilePicture;
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setUploadingPicture(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Upload profile picture first if selected
      let profilePicturePath = null;
      if (profilePicture) {
        profilePicturePath = await uploadProfilePicture();
        if (!profilePicturePath) {
          setLoading(false);
          return;
        }
      }
      
      const data = await authAPI.updateProfile({
        ...formData,
        profilePicture: profilePicturePath,
      });
      
      // Update user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle step navigation
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Render different form steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="setup-step">
            <h3>Basic Information</h3>
            <p className="step-description">Let's start with some basic information about you.</p>
            
            <div className="form-group">
              <label htmlFor="profilePicture">Profile Picture</label>
              <div className="profile-picture-upload">
                <div className="profile-picture-preview">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile preview" />
                  ) : (
                    <div className="profile-picture-placeholder">
                      <span>📷</span>
                      <p>No image selected</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="file-input"
                />
                <label htmlFor="profilePicture" className="file-input-label">
                  {uploadingPicture ? 'Uploading...' : 'Choose Image'}
                </label>
                <small>Max size: 5MB. Supported formats: JPG, PNG, GIF</small>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself (max 500 characters)"
                maxLength={500}
                rows={4}
              />
              <small>{formData.bio.length}/500 characters</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="interests">Interests (comma-separated)</label>
              <input
                type="text"
                id="interests"
                name="interests"
                value={formData.interests.join(', ')}
                onChange={(e) => handleArrayChange('interests', e.target.value)}
                placeholder="reading, hiking, cooking, travel"
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="setup-step">
            <h3>Personality Assessment</h3>
            <p className="step-description">Help us understand your personality traits.</p>
            
            <div className="form-group slider-group">
              <label>Introvert vs. Extrovert</label>
              <div className="slider-labels">
                <span>Very Introverted</span>
                <span>Very Extroverted</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.personality.introvertExtrovert}
                onChange={(e) => handleSliderChange('personality', 'introvertExtrovert', e.target.value)}
                className="slider"
              />
              <div className="slider-value">{formData.personality.introvertExtrovert}/10</div>
            </div>
            
            <div className="form-group slider-group">
              <label>Thinking vs. Feeling</label>
              <div className="slider-labels">
                <span>Very Logical</span>
                <span>Very Emotional</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.personality.thinkingFeeling}
                onChange={(e) => handleSliderChange('personality', 'thinkingFeeling', e.target.value)}
                className="slider"
              />
              <div className="slider-value">{formData.personality.thinkingFeeling}/10</div>
            </div>
            
            <div className="form-group slider-group">
              <label>Planning vs. Flexibility</label>
              <div className="slider-labels">
                <span>Very Structured</span>
                <span>Very Spontaneous</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.personality.planningFlexibility}
                onChange={(e) => handleSliderChange('personality', 'planningFlexibility', e.target.value)}
                className="slider"
              />
              <div className="slider-value">{formData.personality.planningFlexibility}/10</div>
            </div>
            
            <div className="form-group slider-group">
              <label>Stress Management</label>
              <div className="slider-labels">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.personality.stressManagement}
                onChange={(e) => handleSliderChange('personality', 'stressManagement', e.target.value)}
                className="slider"
              />
              <div className="slider-value">{formData.personality.stressManagement}/10</div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="setup-step">
            <h3>Emotional Patterns</h3>
            <p className="step-description">Tell us about how you communicate and express emotions.</p>
            
            <div className="form-group">
              <label htmlFor="communicationStyle">Communication Style</label>
              <select
                id="communicationStyle"
                name="communicationStyle"
                value={formData.emotionalPatterns.communicationStyle}
                onChange={(e) => handleNestedChange('emotionalPatterns', 'communicationStyle', e.target.value)}
                required
              >
                <option value="">Select your communication style</option>
                <option value="direct">Direct - Straightforward and to the point</option>
                <option value="indirect">Indirect - Subtle and diplomatic</option>
                <option value="analytical">Analytical - Logical and detail-oriented</option>
                <option value="intuitive">Intuitive - Based on feelings and impressions</option>
                <option value="functional">Functional - Practical and solution-focused</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="conflictResolution">Conflict Resolution Style</label>
              <select
                id="conflictResolution"
                name="conflictResolution"
                value={formData.emotionalPatterns.conflictResolution}
                onChange={(e) => handleNestedChange('emotionalPatterns', 'conflictResolution', e.target.value)}
                required
              >
                <option value="">Select your conflict resolution style</option>
                <option value="compromising">Compromising - Finding middle ground</option>
                <option value="accommodating">Accommodating - Putting others' needs first</option>
                <option value="competing">Competing - Standing firm on your position</option>
                <option value="avoiding">Avoiding - Sidestepping conflict when possible</option>
                <option value="collaborating">Collaborating - Working together for best solution</option>
              </select>
            </div>
            
            <div className="form-group slider-group">
              <label>Emotional Expression</label>
              <div className="slider-labels">
                <span>Reserved</span>
                <span>Very Expressive</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.emotionalPatterns.emotionalExpression}
                onChange={(e) => handleSliderChange('emotionalPatterns', 'emotionalExpression', e.target.value)}
                className="slider"
              />
              <div className="slider-value">{formData.emotionalPatterns.emotionalExpression}/10</div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="setup-step">
            <h3>Relationship Preferences</h3>
            <p className="step-description">Help us understand what you're looking for in a relationship.</p>
            
            <div className="form-group">
              <label htmlFor="relationshipType">Relationship Type</label>
              <select
                id="relationshipType"
                name="relationshipType"
                value={formData.relationshipPreferences.relationshipType}
                onChange={(e) => handleNestedChange('relationshipPreferences', 'relationshipType', e.target.value)}
                required
              >
                <option value="">Select relationship type</option>
                <option value="casual">Casual - Taking things slow</option>
                <option value="serious">Serious - Looking for commitment</option>
                <option value="marriage-minded">Marriage-minded - Planning for the future</option>
                <option value="undecided">Undecided - Open to possibilities</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="dealBreakers">Deal Breakers (comma-separated)</label>
              <input
                type="text"
                id="dealBreakers"
                name="dealBreakers"
                value={formData.relationshipPreferences.dealBreakers.join(', ')}
                onChange={(e) => handleArrayChange('dealBreakers', e.target.value)}
                placeholder="smoking, long distance, etc."
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="importantValues">Important Values (comma-separated)</label>
              <input
                type="text"
                id="importantValues"
                name="importantValues"
                value={formData.relationshipPreferences.importantValues.join(', ')}
                onChange={(e) => handleArrayChange('importantValues', e.target.value)}
                placeholder="honesty, communication, respect, etc."
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <h2>Complete Your Profile</h2>
        <p className="setup-subtitle">This information helps us find your perfect match</p>
        
        {error && <div className="setup-error">{error}</div>}
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
        
        <div className="step-indicator">
          <span>Step {currentStep} of 4</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          {renderStep()}
          
          <div className="setup-buttons">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={prevStep}
                className="setup-button secondary"
              >
                Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="setup-button primary"
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="setup-button primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;