import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaLock, FaSpinner, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Auth.css';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const { password, confirmPassword } = formData;
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }
      
      try {
        await authAPI.verifyResetToken(token);
        setTokenValid(true);
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
        toast.error('Invalid or expired reset token');
      }
    };
    
    verifyToken();
  }, [token]);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.resetPassword({
        token,
        password
      });
      
      setSuccess(true);
      toast.success('Password reset successful!');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-spinner">
            <FaSpinner className="spinner" />
            <p>Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-error">
            <h2>Invalid or Expired Link</h2>
            <p>The password reset link is invalid or has expired. Please request a new one.</p>
            <button 
              className="auth-button primary-button"
              onClick={() => navigate('/forgot-password')}
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-success">
            <div className="success-icon">
              <FaCheck />
            </div>
            <h2>Password Reset Successful!</h2>
            <p>Your password has been updated successfully. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button 
          className="back-button" 
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          <FaArrowLeft /> Back
        </button>
        
        <div className="auth-header">
          <h2>Create New Password</h2>
          <p>Create a new password for your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${errors.password ? 'error' : ''}`}>
            <label htmlFor="password">
              <FaLock className="input-icon" /> New Password
            </label>
            <div className="input-with-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Enter new password"
                disabled={loading}
                autoComplete="new-password"
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
          
          <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
            <label htmlFor="confirmPassword">
              <FaLock className="input-icon" /> Confirm New Password
            </label>
            <div className="input-with-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                placeholder="Confirm new password"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>
          
          <button 
            type="submit" 
            className="auth-button primary-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" />
                Updating...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
