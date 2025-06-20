import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { FacebookLogin } from '@react-oauth/facebook';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const SocialLogin = ({ onSuccess, onError }) => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await api.post('/api/auth/google', {
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

  const handleFacebookSuccess = async (response) => {
    try {
      const { accessToken } = response;
      const apiResponse = await api.post('/api/auth/facebook', {
        access_token: accessToken
      });
      
      const { token, user } = apiResponse.data;
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
      console.error('Facebook login error:', error);
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
              >
                <FcGoogle className="social-icon" />
                Continue with Google
              </button>
            )}
          />
        </GoogleOAuthProvider>
        
        <FacebookLogin
          appId={process.env.REACT_APP_FACEBOOK_APP_ID}
          autoLoad={false}
          fields="name,email,picture"
          callback={handleFacebookSuccess}
          onFailure={(error) => {
            console.error('Facebook login failed:', error);
            if (onError) onError(new Error('Facebook login failed'));
          }}
          render={({ onClick }) => (
            <button 
              className="social-btn facebook-btn"
              onClick={onClick}
            >
              <FaFacebook className="social-icon" />
              Continue with Facebook
            </button>
          )}
        />
      </div>
    </div>
  );
};

export default SocialLogin;
