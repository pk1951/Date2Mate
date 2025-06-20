import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SocialLogin = ({ onSuccess, onError }) => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('https://date2mate.onrender.com/api/auth/google', {
        token: credentialResponse.credential
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
      
      if (onSuccess) onSuccess(user);
      
      // Redirect based on user's profile completion status
      if (user.profileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (onError) onError(error);
    }
  };



  return (
    <div className="social-login-container">
      <div className="divider">
        <span>OR</span>
      </div>
      
      <div className="social-buttons">
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Login Failed');
              if (onError) onError(new Error('Google login failed'));
            }}
            render={({ onClick }) => (
              <button 
                className="social-btn google-btn"
                onClick={onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  },
                }}
              >
                <FcGoogle className="social-icon" style={{ marginRight: '0.5rem' }} />
                Continue with Google
              </button>
            )}
          />
        </GoogleOAuthProvider>
      </div>
    </div>
  );
};

export default SocialLogin;
