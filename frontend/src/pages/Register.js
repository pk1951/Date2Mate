import React, { useState } from 'react';
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
    location: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, age, gender, location } = formData;

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
    if (!location.trim()) newErrors.location = 'Location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          location
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message
      toast.success('Account created successfully! Redirecting to login...');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
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
          <div className="logo-section">
            <h1 className="brand-title">
              <FaHeart className="heart-icon" />
              Date2Mate
            </h1>
          </div>
          
          <h2 className="brand-tagline">Find Your Perfect Match</h2>
          
          <p className="brand-description">
            Discover meaningful connections through mindful dating. One match per day, focused on quality over quantity.
          </p>
          
          <DailyQuote />
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <h2>Create Your Account</h2>
          <p className="form-subtitle">Join our community of mindful daters</p>
          
          <form onSubmit={onSubmit} className="auth-form">
            {/* Name Field */}
            <div className="form-group">
              <div className={`input-group ${errors.name ? 'error' : ''}`}>
                <span className="input-icon">
                  <FaUser />
                </span>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={onChange}
                  placeholder="Full Name"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <div className={`input-group ${errors.email ? 'error' : ''}`}>
                <span className="input-icon">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="Email Address"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className={`input-group ${errors.password ? 'error' : ''}`}>
                <span className="input-icon">
                  <FaLock />
                </span>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="Password (min 6 characters)"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <div className={`input-group ${errors.confirmPassword ? 'error' : ''}`}>
                <span className="input-icon">
                  <FaLock />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  placeholder="Confirm Password"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>

            {/* Age Field */}
            <div className="form-group">
              <div className={`input-group ${errors.age ? 'error' : ''}`}>
                <span className="input-icon">
                  <FaBirthdayCake />
                </span>
                <input
                  type="number"
                  name="age"
                  value={age}
                  onChange={onChange}
                  placeholder="Age"
                  min="18"
                  max="120"
                  className={`form-control ${errors.age ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.age && <div className="error-message">{errors.age}</div>}
            </div>

            {/* Gender Field */}
            <div className="form-group">
              <div className={`input-group ${errors.gender ? 'error' : ''}`}>
                <span className="input-icon">
                  <FaVenusMars />
                </span>
                <select
                  name="gender"
                  value={gender}
                  onChange={onChange}
                  className={`form-control ${errors.gender ? 'is-invalid' : ''}`}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              {errors.gender && <div className="error-message">{errors.gender}</div>}
            </div>

            {/* Location Field - Simplified to text input */}
            <div className="form-group">
              <div className={`input-group ${errors.location ? 'error' : ''}`}>
                <span className="input-icon">
                  <FaMapMarkerAlt />
                </span>
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={onChange}
                  placeholder="Your Location (e.g., New York, USA)"
                  className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.location && <div className="error-message">{errors.location}</div>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || isSubmitting}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" /> Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;