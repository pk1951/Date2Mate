import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Auth.css';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authAPI.forgotPassword({ email });
      setMessage('Password reset link has been sent to your email');
      toast.success('Password reset link sent!');
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.response?.data?.message || 'Failed to send reset link');
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

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
          <h2>Reset Your Password</h2>
          <p>Enter your email and we'll send you a link to reset your password</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}
        
        {message ? (
          <div className="auth-success">
            <p>{message}</p>
            <p>Didn't receive an email? Check your spam folder or <button 
              className="text-link" 
              onClick={handleSubmit}
              disabled={loading}
            >
              try again
            </button></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope className="input-icon" /> Email
              </label>
              <div className="input-with-icon">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="auth-button primary-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
        
        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
