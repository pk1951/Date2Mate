import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaUser, FaComments, FaClock, FaChartLine, FaCog, FaSignOutAlt, FaBell, FaStar, FaUsers, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import ChatActivityGraph from '../components/ChatActivityGraph';
import { matchesAPI, authAPI, notificationsAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userState, setUserState] = useState('available');
  const [currentMatch, setCurrentMatch] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reflectionTimeRemaining, setReflectionTimeRemaining] = useState(null);
  const [userStats, setUserStats] = useState({
    totalMatches: 0,
    successfulConnections: 0,
    averageCompatibility: 0,
    daysActive: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [chatMessageCount, setChatMessageCount] = useState(0);
  const [chatDuration, setChatDuration] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [activityData, setActivityData] = useState({
    messages: [],
    matches: [],
    connections: []
  });
  const [showReflectionPrompts, setShowReflectionPrompts] = useState(false);

  // Daily motivation quotes
  const [dailyQuote] = useState({
    text: "Love is not about finding the perfect person, but about seeing an imperfect person perfectly.",
    author: "Sam Keen"
  });

  // Enhanced fetch daily match data with better error handling
  const fetchDailyMatch = useCallback(async () => {
    setLoading(true);
    setError('');
    console.log('Starting to fetch dashboard data...');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token found in localStorage:', !!token);
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Fetching user data...');
      try {
        // First get the current user data
        const userData = await authAPI.getCurrentUser();
        console.log('Successfully fetched current user:', userData);
        
        // Update user info and stats
        if (userData) {
          // Save user info to localStorage for quick access
          localStorage.setItem('userInfo', JSON.stringify(userData));
          
          setUserInfo(userData);
          setUserStats({
            totalMatches: userData.totalMatches || 0,
            successfulConnections: userData.successfulConnections || 0,
            averageCompatibility: userData.averageCompatibility || 0,
            daysActive: userData.daysActive || 0
          });
        }
        
        // Then fetch match data
        console.log('Fetching match data...');
        try {
          const matchData = await matchesAPI.getDailyMatches();
          console.log('Successfully fetched daily matches:', matchData);
          
          if (matchData) {
            setMatchData(matchData);
            
            if (matchData.currentState === 'frozen' && matchData.reflectionPeriodEnd) {
              const endTime = new Date(matchData.reflectionPeriodEnd).getTime();
              const now = new Date().getTime();
              const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
              setReflectionTimeRemaining(timeRemaining);
              setUserState('frozen');
              setShowReflectionPrompts(true);
            } else if (matchData.currentMatch) {
              setCurrentMatch(matchData.currentMatch);
              setUserState('in_conversation');
            } else {
              setUserState('available');
            }
          } else {
            setUserState('available');
          }
          
          // Finally, fetch additional data
          console.log('Fetching additional data...');
          try {
            await Promise.all([
              fetchChatActivity(token),
              fetchNotifications(token)
            ]);
          } catch (additionalDataError) {
            console.warn('Error fetching additional data (non-critical):', additionalDataError);
            // Continue even if additional data fails to load
          }
          
        } catch (matchError) {
          console.error('Error fetching match data:', matchError);
          setUserState('available');
          throw new Error(`Failed to load match data: ${matchError.message || 'Unknown error'}`);
        }
        
      } catch (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error(`Failed to load user data: ${userError.message || 'Unknown error'}`);
      }

    } catch (err) {
      console.error('Error in fetchDailyMatch:', err);
      const errorMessage = err.message || 'Failed to load dashboard data. Please try again later.';
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      setError(errorMessage);
      
      // If it's an auth error, redirect to login
      if (err.message.includes('401') || err.message.includes('token') || err.message.includes('session')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchUserState = useCallback(async (token) => {
    try {
      const data = await matchesAPI.getDailyMatches();
      if (data.currentState === 'frozen' && data.reflectionPeriodEnd) {
        const endTime = new Date(data.reflectionPeriodEnd).getTime();
        const now = new Date().getTime();
        const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setReflectionTimeRemaining(timeRemaining);
        setUserState('frozen');
        setUserInfo(prevUserInfo => {
          const updatedUserInfo = { ...prevUserInfo, currentState: 'frozen' };
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          return updatedUserInfo;
        });
        fetchChatActivity(token);
      }
    } catch (error) {
      console.error('Error fetching user state:', error);
    }
  }, []);

  // Get user info and token from localStorage
  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = localStorage.getItem('token');

    if (!token || !storedUserInfo) {
      navigate('/login');
      return;
    }

    setUserInfo(storedUserInfo);

    // Set initial user state
    if (storedUserInfo.currentState) {
      setUserState(storedUserInfo.currentState);
    }

    // Fetch daily match
    fetchDailyMatch(token);
    fetchUserStats(token);
    fetchNotifications(token);
    fetchCurrentUserInfo(token);
  }, [navigate, fetchDailyMatch]);

  // Countdown timer for reflection period
  useEffect(() => {
    let timer;
    if (userState === 'frozen' && reflectionTimeRemaining) {
      timer = setInterval(() => {
        setReflectionTimeRemaining(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            setUserState('available');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [userState, reflectionTimeRemaining, fetchDailyMatch, fetchUserState]);

  // Fetch user statistics
  const fetchUserStats = async (token) => {
    try {
      // This would be a real API call in production
      // For now, we'll simulate some stats
      setUserStats({
        totalMatches: 12,
        successfulConnections: 8,
        averageCompatibility: 87,
        daysActive: 45
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch current user info from backend
  const fetchCurrentUserInfo = async (token) => {
    try {
      console.log('Fetching current user info...');
      const data = await authAPI.getCurrentUser();
      console.log('Current user data:', data);
      
      if (data) {
        const updatedUser = { 
          ...data,
          // Ensure we have all required fields with defaults
          name: data.name || 'User',
          email: data.email || '',
          profilePicture: data.profilePicture || '',
          totalMatches: data.totalMatches || 0,
          successfulConnections: data.successfulConnections || 0,
          averageCompatibility: data.averageCompatibility || 0,
          daysActive: data.daysActive || 0
        };
        
        setUserInfo(updatedUser);
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        
        // Also update user stats
        setUserStats({
          totalMatches: updatedUser.totalMatches,
          successfulConnections: updatedUser.successfulConnections,
          averageCompatibility: updatedUser.averageCompatibility,
          daysActive: updatedUser.daysActive
        });
        
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user info:', {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      });
      
      // If it's an auth error, clear local storage and redirect to login
      if (error.message.includes('401') || error.message.includes('token') || error.message.includes('session')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        navigate('/login');
      }
      
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Fetch real chat activity data
  const fetchChatActivity = async (token) => {
    try {
      console.log('Fetching chat activity...');
      const data = await notificationsAPI.getActivity();
      console.log('Chat activity data:', data);

      if (data) {
        setMatchData(prev => ({
          ...prev,
          startTime: data.matchStartTime ? new Date(data.matchStartTime) : new Date(),
          endTime: data.matchEndTime ? new Date(data.matchEndTime) : new Date(),
          duration: data.matchDuration || 0
        }));
        setChatDuration(data.matchDuration || 0);
        setChatMessageCount(data.totalMessages || 0);
        setActivityData(data.activityData || []);
      }
    } catch (error) {
      console.error('Error fetching chat activity:', error);
      // Set default values on error
      setMatchData(prev => ({
        ...prev,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0
      }));
      setChatDuration(0);
      setChatMessageCount(0);
      setActivityData([]);
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Fetch notifications
  const fetchNotifications = async (token) => {
    try {
      console.log('Fetching notifications...');
      const data = await notificationsAPI.getNotifications();
      console.log('Notifications data:', data);
      
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set default values on error
      setNotifications([]);
      setUnreadCount(0);
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Handle pin/unpin match
  const handlePinMatch = async () => {
    if (!currentMatch) return;

    try {
      const data = await matchesAPI.pinMatch(currentMatch._id);
      setUserState('pinned');
      setCurrentMatch(data.match);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle unpin match
  const handleUnpinMatch = async (reason = 'not_compatible', details = '') => {
    if (!currentMatch) return;

    try {
      const data = await matchesAPI.unpinMatch(currentMatch._id, { reason, details });

      setUserState('frozen');
      setCurrentMatch(null);
      setMatchedUser(null);

      // Set reflection period countdown
      if (data.reflectionPeriodEnd) {
        const endTime = new Date(data.reflectionPeriodEnd).getTime();
        const now = new Date().getTime();
        const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setReflectionTimeRemaining(timeRemaining);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Format time remaining for display
  const formatTimeRemaining = (seconds) => {
    if (!seconds) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Enhanced render content with reflection period UI
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your mindful dating experience...</p>
          {userState === 'frozen' && (
            <div className="reflection-hint">
              <p>Preparing your reflection period...</p>
            </div>
          )}
        </div>
      );
    }

    // Don't show error if user is in frozen state
    if (error && userState !== 'frozen') {
      return (
        <div className="dashboard-error">
          <div className="error-card">
            <FaHeart className="error-icon" />
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button 
              onClick={() => fetchDailyMatch(localStorage.getItem('token'))}
              className="dashboard-button retry"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Handle frozen state first
    if (userState === 'frozen') {
      // Check if user has feedback (person who got ended on) or not (person who ended)
      const hasFeedback = notifications.find(n => n.type === 'feedback');
      
      return (
        <div className="dashboard-frozen">
          <div className="frozen-layout">
            {/* Left side - Timer and Reflection */}
            <div className="frozen-left">
              <div className="reflection-card enhanced">
                <div className="reflection-header">
                  <FaClock className="reflection-icon" />
                  <h3>Time to Reflect & Grow</h3>
                </div>
                
                {/* Show feedback if user got ended on */}
                {hasFeedback && (
                  <div className="feedback-section">
                    <h4>Match Feedback</h4>
                    <div className="feedback-card">
                      <p><strong>Reason:</strong> {hasFeedback.message.split('Reason: ')[1]}</p>
                      {hasFeedback.details && (
                        <p><strong>Details:</strong> {hasFeedback.details}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="reflection-text">
                  {hasFeedback 
                    ? "Your match has ended. Take this time to reflect on the experience and what you can learn from it."
                    : "You've ended your last match. Take this time to reflect on what you're looking for and grow from the experience."
                  }
                </p>
                
                <div className="countdown-section">
                  <h4>Next Match Available In:</h4>
                  <div className="countdown-timer enhanced">
                    <div className="timer-display">{formatTimeRemaining(reflectionTimeRemaining)}</div>
                    <div className="timer-labels">
                      <span>Hours</span>
                      <span>Minutes</span>
                      <span>Seconds</span>
                    </div>
                  </div>
                </div>
                
                <div className="reflection-prompts enhanced">
                  <h4>Reflection Prompts</h4>
                  <div className="prompts-grid">
                    <div className="prompt-card">
                      <FaHeart className="prompt-icon" />
                      <p>What did you appreciate about your last match?</p>
                    </div>
                    <div className="prompt-card">
                      <FaStar className="prompt-icon" />
                      <p>What qualities are most important to you in a partner?</p>
                    </div>
                    <div className="prompt-card">
                      <FaComments className="prompt-icon" />
                      <p>How can you better communicate your needs in the future?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Chat Activity */}
            <div className="frozen-right">
              {matchData && (
                <div className="chat-activity-section">
                  <h3>Your Chat Activity</h3>
                  <ChatActivityGraph 
                    matchData={matchData}
                    messageCount={chatMessageCount}
                    totalHours={chatDuration}
                    activityData={activityData}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    switch (userState) {
      case 'available':
        return (
          <div className="dashboard-available">
            <div className="welcome-section">
              <div className="welcome-card">
                <div className="welcome-header">
                  <FaHeart className="welcome-icon" />
                  <h2>Welcome back, {userInfo?.name || 'User'}! 💕</h2>
                </div>
                <p className="welcome-text">Ready for your daily dose of love? Let's find your perfect match!</p>
              </div>
            </div>

            <div className="daily-quote-section">
              <div className="quote-card">
                <div className="quote-content">
                  <p className="quote-text">"{dailyQuote.text}"</p>
                  <span className="quote-author">— {dailyQuote.author}</span>
                </div>
                <div className="quote-decoration">
                  <FaHeart className="quote-heart" />
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <FaUsers className="stat-icon" />
                <div className="stat-content">
                  <h3>{userStats.totalMatches}</h3>
                  <p>Total Matches</p>
                </div>
              </div>
              <div className="stat-card">
                <FaStar className="stat-icon" />
                <div className="stat-content">
                  <h3>{userStats.successfulConnections}</h3>
                  <p>Successful Connections</p>
                </div>
              </div>
              <div className="stat-card">
                <FaChartLine className="stat-icon" />
                <div className="stat-content">
                  <h3>{userStats.averageCompatibility}%</h3>
                  <p>Avg. Compatibility</p>
                </div>
              </div>
              <div className="stat-card">
                <FaCalendarAlt className="stat-icon" />
                <div className="stat-content">
                  <h3>{userStats.daysActive}</h3>
                  <p>Days Active</p>
                </div>
              </div>
            </div>

            <div className="match-request-section">
              <div className="match-request-card">
                <div className="match-request-content">
                  <h3>Your Daily Match Awaits</h3>
                  <p>Based on your personality, interests, and relationship goals, we've found someone special just for you.</p>
            <button 
              onClick={() => fetchDailyMatch(localStorage.getItem('token'))}
                    className="dashboard-button primary pulse-button"
            >
                    <FaHeart className="button-icon" />
              Find My Match
            </button>
                </div>
                <div className="match-request-illustration">
                  <div className="floating-hearts">
                    <div className="heart heart-1">💕</div>
                    <div className="heart heart-2">💖</div>
                    <div className="heart heart-3">💝</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => navigate('/profile-setup')}>
                  <FaUser className="quick-action-icon" />
                  <span>Update Profile</span>
                </button>
                <button className="quick-action-card" onClick={() => navigate('/settings')}>
                  <FaCog className="quick-action-icon" />
                  <span>Settings</span>
                </button>
                <button className="quick-action-card" onClick={() => window.open('https://date2mate.com/help', '_blank')}>
                  <FaComments className="quick-action-icon" />
                  <span>Get Help</span>
                </button>
              </div>
            </div>

            <div className="recent-activity-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">
                    <FaHeart />
                  </div>
                  <div className="activity-content">
                    <p>You had a great conversation with Sarah</p>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <FaStar />
                  </div>
                  <div className="activity-content">
                    <p>You pinned a match with Michael</p>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <FaChartLine />
                  </div>
                  <div className="activity-content">
                    <p>Your compatibility score improved by 5%</p>
                    <span className="activity-time">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Show chat activity graph if available */}
            {matchData && (
              <div className="chat-activity-section">
                <h3>Your Recent Chat Activity</h3>
                <ChatActivityGraph 
                  matchData={matchData}
                  messageCount={chatMessageCount}
                  totalHours={chatDuration}
                  activityData={activityData}
                />
              </div>
            )}

            {/* Show notifications for available users */}
            {notifications.length > 0 && (
              <div className="notifications-section">
                <h3>Recent Updates</h3>
                <div className="notifications-list">
                  {notifications.slice(0, 3).map(notification => (
                    <div key={notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        {notification.details && (
                          <p className="notification-details">{notification.details}</p>
                        )}
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'matched':
      case 'pinned':
        return (
          <div className="dashboard-matched">
            <div className="match-status-banner">
              <div className={`status-indicator ${userState}`}>
                <FaHeart className="status-icon" />
                <span>{userState === 'pinned' ? 'Match Pinned' : 'New Match!'}</span>
              </div>
            </div>
            
            {matchedUser && (
              <div className="match-card enhanced">
                <div className="match-header enhanced">
                  <div className="match-photo-container">
                  <div 
                      className="match-photo enhanced" 
                    style={{ 
                      backgroundImage: `url(${matchedUser.profilePicture ? 
                        (matchedUser.profilePicture.startsWith('http') ? 
                          matchedUser.profilePicture : 
                          `${process.env.REACT_APP_API_BASE_URL || ''}${matchedUser.profilePicture}`) : 
                        '/default-avatar.png'})` 
                    }}
                    >
                      <div className="photo-overlay">
                        <FaUser className="photo-icon" />
                      </div>
                    </div>
                    <div className="match-badge">
                      <FaStar className="badge-icon" />
                    </div>
                  </div>
                  <div className="match-info enhanced">
                    <h3 className="match-name">{matchedUser.name}, {matchedUser.age}</h3>
                    <p className="match-location">
                      <FaMapMarkerAlt className="location-icon" />
                      {matchedUser.location}
                    </p>
                    
                    {currentMatch && (
                      <div className="compatibility-score enhanced">
                        <div className="score-header">
                          <span className="score-label">Compatibility Score</span>
                          <span className="score-value">{currentMatch.compatibilityScore}%</span>
                        </div>
                        <div className="score-bar enhanced">
                          <div 
                            className="score-fill enhanced" 
                            style={{ width: `${currentMatch.compatibilityScore}%` }}
                          ></div>
                        </div>
                        <div className="compatibility-factors">
                          <div className="factor">
                            <span>Personality</span>
                            <div className="factor-bar">
                              <div className="factor-fill" style={{ width: `${currentMatch.compatibilityFactors?.personalityMatch || 0}%` }}></div>
                            </div>
                          </div>
                          <div className="factor">
                            <span>Emotional</span>
                            <div className="factor-bar">
                              <div className="factor-fill" style={{ width: `${currentMatch.compatibilityFactors?.emotionalMatch || 0}%` }}></div>
                            </div>
                          </div>
                          <div className="factor">
                            <span>Interests</span>
                            <div className="factor-bar">
                              <div className="factor-fill" style={{ width: `${currentMatch.compatibilityFactors?.interestMatch || 0}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="match-body enhanced">
                  <div className="bio-section">
                    <h4>About {matchedUser.name}</h4>
                    <p className="match-bio">{matchedUser.bio || "This person hasn't written a bio yet."}</p>
                  </div>
                  
                  {matchedUser.interests && matchedUser.interests.length > 0 && (
                    <div className="match-interests enhanced">
                      <h4>Interests</h4>
                      <div className="interest-tags enhanced">
                        {matchedUser.interests.map((interest, index) => (
                          <span key={index} className="interest-tag enhanced">{interest}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="match-actions enhanced">
                  <button 
                    onClick={() => navigate(`/chat/${currentMatch._id}`)}
                    className="dashboard-button primary enhanced"
                  >
                    <FaComments className="button-icon" />
                    Start Chatting
                  </button>
                  
                  <button 
                    onClick={() => navigate(`/decision/${currentMatch._id}`)}
                    className="dashboard-button decision enhanced"
                  >
                    <FaHeart className="button-icon" />
                    Decision Time
                  </button>
                  
                  {userState === 'matched' ? (
                    <button 
                      onClick={handlePinMatch}
                      className="dashboard-button secondary enhanced"
                    >
                      <FaStar className="button-icon" />
                      Pin Match
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUnpinMatch()}
                      className="dashboard-button danger enhanced"
                    >
                      <FaClock className="button-icon" />
                      End Match
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Show chat activity graph if available */}
            {matchData && (
              <div className="chat-activity-section">
                <h3>Your Chat Activity</h3>
                <ChatActivityGraph 
                  matchData={matchData}
                  messageCount={chatMessageCount}
                  totalHours={chatDuration}
                  activityData={activityData}
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="dashboard-error">
            <div className="error-card">
              <FaHeart className="error-icon" />
              <h3>Something went wrong</h3>
              <p>Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="dashboard-button retry"
            >
              Refresh
            </button>
            </div>
          </div>
        );
    }
  };

  // Render reflection period UI when in frozen state
  const renderReflectionPeriod = () => (
    <div className="reflection-container">
      <div className="reflection-header">
        <h2>Reflection Period</h2>
        <p>Take some time to reflect on your recent match</p>
      </div>
      
      <div className="reflection-timer">
        <FaClock className="reflection-icon" />
        <span>Time Remaining: {formatTimeRemaining(reflectionTimeRemaining)}</span>
      </div>

      {showReflectionPrompts && (
        <div className="reflection-prompts">
          <h3>Reflection Prompts</h3>
          <div className="prompt-cards">
            <div className="prompt-card">
              <FaHeart className="prompt-icon" />
              <p>What did you appreciate about your last match?</p>
            </div>
            <div className="prompt-card">
              <FaStar className="prompt-icon" />
              <p>What qualities are most important to you in a partner?</p>
            </div>
            <div className="prompt-card">
              <FaComments className="prompt-icon" />
              <p>How can you better communicate your needs in the future?</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container enhanced">
      {userState === 'frozen' && renderReflectionPeriod()}
      <header className="dashboard-header enhanced">
        <div className="header-left">
          <div className="logo-section">
            <FaHeart className="logo-icon" />
            <h1 className="app-title">Date2Mate</h1>
          </div>
          <div className="user-welcome">
            <span>Welcome back, {userInfo?.name || 'User'}</span>
          </div>
        </div>
        
        <nav className="dashboard-nav enhanced">
          <div className="nav-item notifications">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="nav-button notification-button"
            >
              <FaBell className="nav-icon" />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="notifications-dropdown">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        {notification.details && (
                          <p className="notification-details">{notification.details}</p>
                        )}
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-item">
                    <div className="notification-content">
                      <p>No notifications</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button onClick={() => navigate('/settings')} className="nav-button">
            <FaCog className="nav-icon" />
            <span>Settings</span>
          </button>
          
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
              navigate('/login');
            }} 
            className="nav-button logout"
          >
            <FaSignOutAlt className="nav-icon" />
            <span>Logout</span>
          </button>
        </nav>
      </header>
      
      <main className="dashboard-content enhanced">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;