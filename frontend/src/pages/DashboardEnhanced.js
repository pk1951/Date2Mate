import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaUser, FaComments, FaClock, FaChartLine, FaCog, FaSignOutAlt, FaBell, FaStar, FaUsers, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import ChatActivityGraph from '../components/ChatActivityGraph';
import '../styles/Dashboard.css';

const DashboardEnhanced = () => {
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

  // Get user info and token from localStorage
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = localStorage.getItem('token');

    if (!token || !userInfo) {
      navigate('/login');
      return;
    }

    // Set initial user state
    if (userInfo.currentState) {
      setUserState(userInfo.currentState);
    }

    // Fetch daily match
    fetchDailyMatch(token);
    fetchUserStats(token);
    fetchNotifications(token);
  }, [navigate]);

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
  }, [userState, reflectionTimeRemaining]);

  // Fetch daily match
  const fetchDailyMatch = async (token) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/matches/daily', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If user is in reflection period, set the countdown
        if (data.currentState === 'frozen' && data.reflectionPeriodEnd) {
          const endTime = new Date(data.reflectionPeriodEnd).getTime();
          const now = new Date().getTime();
          const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setReflectionTimeRemaining(timeRemaining);
          setUserState('frozen');
          
          // If user has feedback, add it to notifications
          if (data.lastFeedback) {
            const feedbackNotification = {
              id: 'feedback_' + new Date(data.lastFeedback.receivedAt).getTime(),
              type: 'feedback',
              message: `Your match ended. Reason: ${data.lastFeedback.reason}`,
              details: data.lastFeedback.details,
              time: 'Just now',
              read: false,
              timestamp: new Date(data.lastFeedback.receivedAt)
            };
            setNotifications(prev => [feedbackNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Extract match data for activity graph
            if (data.stateStartTime) {
              const matchStartTime = new Date(data.stateStartTime);
              const matchEndTime = new Date(data.lastFeedback.receivedAt);
              const durationHours = Math.ceil((matchEndTime - matchStartTime) / (1000 * 60 * 60));
              
              setMatchData({
                startTime: matchStartTime,
                endTime: matchEndTime,
                duration: durationHours
              });
              setChatDuration(durationHours);
              
              // Estimate message count based on duration (for demo purposes)
              // In real app, this would come from the backend
              const estimatedMessages = Math.floor(durationHours * 15); // 15 messages per hour average
              setChatMessageCount(estimatedMessages);
            }
          }
        }
        throw new Error(data.message || 'Failed to fetch daily match');
      }

      setCurrentMatch(data.match);
      setMatchedUser(data.matchedUser);
      setUserState(data.match.status === 'pinned' ? 'pinned' : 'matched');
    } catch (error) {
      console.error('Error fetching daily match:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch notifications
  const fetchNotifications = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Handle pin/unpin match
  const handlePinMatch = async () => {
    if (!currentMatch) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/matches/${currentMatch._id}/pin`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to pin match');
      }

      setUserState('pinned');
      setCurrentMatch(data.match);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle unpin match
  const handleUnpinMatch = async (reason = 'not_compatible', details = '') => {
    if (!currentMatch) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/matches/${currentMatch._id}/unpin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, details }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unpin match');
      }

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

  // Get user info
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Render different content based on user state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="dashboard-loading">
          <div className="loading-animation">
            <div className="heart-pulse"></div>
            <p>Finding your perfect match...</p>
          </div>
        </div>
      );
    }

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

    switch (userState) {
      case 'available':
        return (
          <div className="dashboard-available">
            <div className="welcome-section">
              <div className="welcome-card">
                <div className="welcome-header">
                  <FaHeart className="welcome-icon" />
                  <h2>Welcome back, {userInfo.name}! 💕</h2>
                </div>
                <p className="welcome-text">Ready for your daily dose of love? Let's find your perfect match!</p>
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
                      style={{ backgroundImage: `url(${matchedUser.profilePicture || '/default-avatar.png'})` }}
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
          </div>
        );

      case 'frozen':
        return (
          <div className="dashboard-frozen">
            <div className="reflection-section">
              <div className="reflection-card enhanced">
                <div className="reflection-header">
                  <FaClock className="reflection-icon" />
                  <h3>Time to Reflect & Grow</h3>
                </div>
                
                {/* Show feedback if user got ended on */}
                {notifications.find(n => n.type === 'feedback') && (
                  <div className="feedback-section">
                    <h4>Match Feedback</h4>
                    <div className="feedback-card">
                      <p><strong>Reason:</strong> {notifications.find(n => n.type === 'feedback')?.message.split('Reason: ')[1]}</p>
                      {notifications.find(n => n.type === 'feedback')?.details && (
                        <p><strong>Details:</strong> {notifications.find(n => n.type === 'feedback')?.details}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="reflection-text">
                  {notifications.find(n => n.type === 'feedback') 
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
                
                {/* Show activity graph if user got ended on */}
                {notifications.find(n => n.type === 'feedback') && matchData && (
                  <ChatActivityGraph 
                    matchData={matchData}
                    messageCount={chatMessageCount}
                    totalHours={chatDuration}
                  />
                )}
                
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

  return (
    <div className="dashboard-container enhanced">
      <header className="dashboard-header enhanced">
        <div className="header-left">
          <div className="logo-section">
            <FaHeart className="logo-icon" />
            <h1 className="app-title">Date2Mate</h1>
          </div>
          <div className="user-welcome">
            <span>Welcome back, {userInfo.name}</span>
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

export default DashboardEnhanced; 