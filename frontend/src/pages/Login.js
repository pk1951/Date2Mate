import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSpinner, FaGoogle, FaFacebook, FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Auth.css';
import '../styles/AnimatedAuth.css';
import DailyQuote from '../components/DailyQuote';
import { authAPI } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  useEffect(() => {
    // Check for saved email
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
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
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSocialLogin = (provider) => {
    // Implement social login logic here
    toast.info(`${provider} login will be available soon!`);
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
      const data = await authAPI.login({ email, password });

      // Save user data and token to localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
      // Save email for convenience
      localStorage.setItem('savedEmail', email);

      // Show success message
      toast.success('Login successful! Redirecting...');

      // Redirect based on profile completion after a short delay
      setTimeout(() => {
        if (data.isProfileComplete) {
          navigate('/dashboard');
        } else {
          navigate('/profile-setup');
        }
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
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

      {/* Right Side - Login Form */}
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Sign in to continue your mindful dating journey</p>
          </div>
          
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
                  autoComplete="username"
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className={`form-group ${errors.password ? 'error' : ''}`}>
              <div className="password-header">
                <label htmlFor="password">
                  <FaLock className="input-icon" /> Password
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>
              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  className={errors.password ? 'error-input' : ''}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
            
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
            </div>
            
            <button 
              type="submit" 
              className="auth-button primary-button"
              disabled={loading || isSubmitting}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="divider">or</div>
          
          <div className="social-login">
            <button 
              type="button" 
              className="social-btn google"
              onClick={() => handleSocialLogin('Google')}
              disabled={loading}
            >
              <FaGoogle className="social-icon" />
              Continue with Google
            </button>
            
            <button 
              type="button" 
              className="social-btn facebook"
              onClick={() => handleSocialLogin('Facebook')}
              disabled={loading}
            >
              <FaFacebook className="social-icon" />
              Continue with Facebook
            </button>
          </div>
          
          <div className="auth-links">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;