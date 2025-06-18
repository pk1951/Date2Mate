import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaBirthdayCake, FaVenusMars, FaMapMarkerAlt, FaSpinner, FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Auth.css';
import '../styles/AnimatedAuth.css';
import DailyQuote from '../components/DailyQuote';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    location: '',
    locationDetails: {}
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, age, gender, location } = formData;

  useEffect(() => {
    // Load Google Maps Places API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(age) < 18) {
      newErrors.age = 'You must be at least 18 years old';
    }
    
    if (!gender) newErrors.gender = 'Gender is required';
    if (!location) newErrors.location = 'Location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (suggestion) => {
    setFormData({
      ...formData,
      location: suggestion.description,
      locationDetails: {
        placeId: suggestion.place_id,
        mainText: suggestion.structured_formatting.main_text,
        secondaryText: suggestion.structured_formatting.secondary_text || ''
      }
    });
    setShowSuggestions(false);
  };

  const handleLocationChange = async (e) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });
    
    if (value.length > 2) {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: value, types: ['(cities)'] },
          (predictions, status) => {
            if (status === 'OK' && predictions) {
              setLocationSuggestions(predictions);
              setShowSuggestions(true);
            }
          }
        );
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          age: parseInt(age),
          gender,
          location: formData.locationDetails
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message
      toast.success('Account created successfully! Redirecting...');
      
      // Save user data and token to localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);

      // Redirect to profile setup after a short delay
      setTimeout(() => {
        navigate('/profile-setup');
      }, 1500);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animated-auth">
      {/* Left Side - Branding and Animation */}
      <div className="auth-branding">
        <div className="branding-content">
          {/* 1. Date2Mate */}
          <div className="logo-section">
            <h1 className="brand-title">
              <FaHeart className="heart-icon" />
              Date2Mate
            </h1>
          </div>
          
          {/* 2. Find Your Perfect Match */}
          <h2 className="brand-tagline">Find Your Perfect Match</h2>
          
          {/* 3. Description */}
          <p className="brand-description">
            Discover meaningful connections through mindful dating. One match per day, focused on quality over quantity.
          </p>
          
          {/* 4. Daily Quote */}
          <DailyQuote />
          
          {/* Animated Hearts */}
          <div className="hearts-container">
            <div className="heart heart-1">❤️</div>
            <div className="heart heart-2">💕</div>
            <div className="heart heart-3">💖</div>
            <div className="heart heart-4">💝</div>
            <div className="heart heart-5">💗</div>
            <div className="heart heart-6">💓</div>
            <div className="heart heart-7">💞</div>
            <div className="heart heart-8">💟</div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="auth-form-section">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join our mindful dating community</p>
          
          {Object.keys(errors).length > 0 && (
            <div className="auth-error">
              {Object.values(errors).map((error, index) => (
                <div key={index} className="error-message">
                  {error}
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={onSubmit} className="auth-form">
            <div className={`form-group ${errors.name ? 'error' : ''}`}>
              <label htmlFor="name">
                <FaUser className="input-icon" /> Full Name
              </label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  className={errors.name ? 'error-input' : ''}
                  placeholder="Enter your full name"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            
            <div className={`form-group ${errors.email ? 'error' : ''}`}>
              <label htmlFor="email">
                <FaEnvelope className="input-icon" /> Email
              </label>
              <div className="input-with-icon">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  className={errors.email ? 'error-input' : ''}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="form-row">
              <div className={`form-group ${errors.password ? 'error' : ''}`}>
                <label htmlFor="password">
                  <FaLock className="input-icon" /> Password
                </label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    className={errors.password ? 'error-input' : ''}
                    placeholder="Create password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              
              <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
                <label htmlFor="confirmPassword">
                  <FaLock className="input-icon" /> Confirm
                </label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    className={errors.confirmPassword ? 'error-input' : ''}
                    placeholder="Confirm password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className={`form-group ${errors.age ? 'error' : ''}`}>
                <label htmlFor="age">
                  <FaBirthdayCake className="input-icon" /> Age
                </label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={age}
                    onChange={onChange}
                    className={errors.age ? 'error-input' : ''}
                    placeholder="Age"
                    min="18"
                    max="100"
                    disabled={loading}
                  />
                </div>
                {errors.age && <span className="error-text">{errors.age}</span>}
              </div>
              
              <div className={`form-group ${errors.gender ? 'error' : ''}`}>
                <label htmlFor="gender">
                  <FaVenusMars className="input-icon" /> Gender
                </label>
                <div className="select-wrapper">
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={onChange}
                    className={errors.gender ? 'error-input' : ''}
                    disabled={loading}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>
            </div>
            
            <div className={`form-group ${errors.location ? 'error' : ''}`}>
              <label htmlFor="location">
                <FaMapMarkerAlt className="input-icon" /> Location
              </label>
              <div className="input-with-icon location-input">
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={location}
                  onChange={handleLocationChange}
                  className={errors.location ? 'error-input' : ''}
                  placeholder="Enter your city"
                  disabled={loading}
                  autoComplete="off"
                />
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <div className="suggestion-main">{suggestion.structured_formatting.main_text}</div>
                        <div className="suggestion-secondary">{suggestion.structured_formatting.secondary_text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.location && <span className="error-text">{errors.location}</span>}
            </div>
            
            <button 
              type="submit" 
              className="auth-button primary-button"
              disabled={loading || isSubmitting}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;