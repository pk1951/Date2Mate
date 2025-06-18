import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoCall from '../components/VideoCall';
import '../styles/Chat.css';

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchDetails, setMatchDetails] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [milestoneReached, setMilestoneReached] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const listenersSetupRef = useRef(false);
  
  // Get user info once and memoize it to prevent unnecessary re-renders
  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch (error) {
      console.error('Error parsing userInfo:', error);
      return {};
    }
  }, []);
  
  // Place fetchMatchDetails, fetchMessages, fetchMilestoneStatus here, before any useEffect that uses them
  const fetchMatchDetails = useCallback(async (token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/matches/${matchId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch match details');
      }
      setMatchDetails(data.match);
      setMatchedUser(data.matchedUser);
      setMessageCount(data.messageCount);
      setMilestoneReached(data.milestoneReached);
    } catch (error) {
      setError(error.message);
    }
  }, [matchId]);
  
  const fetchMessages = useCallback(async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${matchId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages');
      }
      setMessages(data.messages);
      setMessageCount(data.messageCount);
      setMilestoneReached(data.milestoneReached);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);
  
  const fetchMilestoneStatus = useCallback(async (token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${matchId}/milestone`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch milestone status');
      }
      setMessageCount(data.messageCount);
      setMilestoneReached(data.milestoneReached);
      setTimeRemaining(data.timeRemainingHours * 3600); // Convert hours to seconds
    } catch (error) {
      console.error('Error fetching milestone status:', error);
    }
  }, [matchId]);
  
  // Connect to socket and fetch initial data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !userInfo) {
      navigate('/login');
      return;
    }
    
    fetchMatchDetails(token);
    fetchMessages(token);
    
    // Connect to socket only if not already connected
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 60000,
        forceNew: false
      });
      
      // Set up listeners only once
      if (!listenersSetupRef.current) {
        // Handle connection events
        socketRef.current.on('connect', () => {
          console.log('Connected to socket server');
          
          // Join chat room after successful connection
          socketRef.current.emit('join_chat', {
            matchId: matchId,
            token: token
          });
        });
        
        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });
        
        socketRef.current.on('disconnect', (reason) => {
          console.log('Disconnected from socket server:', reason);
        });
        
        // Listen for chat join confirmation
        socketRef.current.on('chat_joined', (data) => {
          console.log('Successfully joined chat:', data);
        });
        
        socketRef.current.on('chat_join_error', (data) => {
          console.error('Failed to join chat:', data);
        });
        
        // Listen for new messages
        socketRef.current.on('receive_message', (messageData) => {
          setMessages(prevMessages => [...prevMessages, messageData]);
          setMessageCount(prevCount => prevCount + 1);
          
          // Check if milestone reached
          if (messageCount + 1 >= 100 && !milestoneReached) {
            setMilestoneReached(true);
            fetchMilestoneStatus(token);
          }
          
          // Reset typing indicator when message is received
          setIsTyping(false);
        });
        
        // Listen for typing indicator
        socketRef.current.on('user_typing', (data) => {
          if (data.userId !== userInfo._id) {
            setIsTyping(data.isTyping);
          }
        });
        
        // Listen for milestone reached event
        socketRef.current.on('milestone_reached', (data) => {
          if (data.milestoneReached) {
            setMilestoneReached(true);
            fetchMilestoneStatus(token);
          }
        });
        
        // Listen for incoming video calls
        socketRef.current.on('video_call_incoming', (data) => {
          setIncomingCall(true);
        });
        
        // Listen for video call accepted
        socketRef.current.on('video_call_accepted', (data) => {
          setIncomingCall(false);
          setShowVideoCall(true);
        });
        
        // Listen for video call rejected
        socketRef.current.on('video_call_rejected', (data) => {
          setIncomingCall(false);
          alert(`${matchedUser?.name} declined your call: ${data.reason || 'No reason provided'}`);
        });
        
        // Listen for video call ended
        socketRef.current.on('video_call_ended', (data) => {
          setShowVideoCall(false);
        });
        
        // Listen for message errors
        socketRef.current.on('message_error', (data) => {
          console.error('Message error:', data);
          alert('Failed to send message. Please try again.');
        });
        
        listenersSetupRef.current = true;
      }
    } else {
      // If already connected, just join the chat room
      socketRef.current.emit('join_chat', {
        matchId: matchId,
        token: token
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      listenersSetupRef.current = false;
    };
  }, [matchId, navigate, fetchMatchDetails, fetchMessages, fetchMilestoneStatus, matchedUser?.name, messageCount, milestoneReached, userInfo]);
  
  // Fetch milestone status periodically
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetchMilestoneStatus(token);
    
    const intervalId = setInterval(() => {
      fetchMilestoneStatus(token);
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [matchId, fetchMilestoneStatus]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Countdown timer for 48-hour milestone
  useEffect(() => {
    if (timeRemaining === null) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining]);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Emit typing event only if socket is connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', {
        matchId,
        userId: userInfo._id,
        isTyping: e.target.value.length > 0
      });
    }
  };
  
  // Handle video call
  const handleVideoCall = () => {
    if (!milestoneReached) {
      alert('You need to reach the 100 message milestone to make video calls!');
      return;
    }
    
    // Emit video call request only if socket is connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('video_call_request', {
        matchId,
        caller: {
          _id: userInfo._id,
          name: userInfo.name,
          profilePicture: userInfo.profilePicture
        }
      });
      
      // Show video call interface
      setShowVideoCall(true);
    } else {
      alert('Connection lost. Please refresh the page and try again.');
    }
  };
  
  // Handle incoming call response
  const handleAcceptCall = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('video_call_accepted', {
        matchId,
        signal: null // In a real implementation, this would be WebRTC signaling data
      });
      
      setIncomingCall(false);
      setShowVideoCall(true);
    }
  };
  
  const handleRejectCall = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('video_call_rejected', {
        matchId,
        reason: 'Call declined'
      });
      
      setIncomingCall(false);
    }
  };
  
  // Handle ending video call
  const handleEndCall = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('video_call_ended', {
        matchId
      });
    }
    
    setShowVideoCall(false);
  };
  
  // Handle unpin match
  const handleUnpinMatch = async () => {
    if (!matchDetails) return;
    
    if (window.confirm('Are you sure you want to end this match? You will enter a 24-hour reflection period.')) {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:5000/api/matches/${matchId}/unpin`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: 'no_chemistry',
            details: 'Decided to move on',
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to unpin match');
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        setError(error.message);
      }
    }
  };
  
  useEffect(() => {
    fetchMatchDetails();
    fetchMessages();
    fetchMilestoneStatus();
  }, [fetchMatchDetails, fetchMessages, fetchMilestoneStatus, matchedUser?.name, messageCount, milestoneReached, userInfo]);
  
  if (loading && !messages.length) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }
  
  // If video call is active, show video call component
  if (showVideoCall) {
    return (
      <VideoCall 
        matchId={matchId}
        matchedUser={matchedUser}
        onEndCall={handleEndCall}
      />
    );
  }
  
  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          &larr; Back
        </button>
        
        {matchedUser && (
          <div className="chat-user-info">
            <div 
              className="user-avatar" 
              style={{ 
                backgroundImage: `url(${matchedUser.profilePicture ? 
                  (matchedUser.profilePicture.startsWith('http') ? 
                    matchedUser.profilePicture : 
                    `http://localhost:5000${matchedUser.profilePicture}`) : 
                  '/default-avatar.png'
                })` 
              }}
            ></div>
            <div className="user-details">
              <h3>{matchedUser.name}</h3>
              <p>{matchedUser.location}</p>
            </div>
          </div>
        )}
        
        <div className="chat-actions">
          {milestoneReached ? (
            <button onClick={handleVideoCall} className="video-call-button">
              Video Call
            </button>
          ) : (
            <div className="milestone-info">
              <span>{messageCount}/100 messages</span>
              <div className="milestone-progress">
                <div 
                  className="milestone-bar" 
                  style={{ width: `${Math.min(100, (messageCount / 100) * 100)}%` }}
                ></div>
              </div>
              {timeRemaining !== null && (
                <span className="time-remaining">{formatTimeRemaining(timeRemaining)} remaining</span>
              )}
            </div>
          )}
          
          <button onClick={() => navigate(`/decision/${matchId}`)} className="decision-button">
            Decision Time
          </button>
          
          <button onClick={handleUnpinMatch} className="unpin-button">
            End Match
          </button>
        </div>
      </div>
      
      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-container">
            <h3>Incoming Video Call</h3>
            <p>{matchedUser?.name} is calling you</p>
            <div className="incoming-call-actions">
              <button onClick={handleAcceptCall} className="accept-call-button">
                Accept
              </button>
              <button onClick={handleRejectCall} className="reject-call-button">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message._id} 
              className={`message ${message.sender._id === userInfo._id ? 'sent' : 'received'}`}
            >
              <div className="message-avatar">
                <div 
                  className="sender-avatar" 
                  style={{ 
                    backgroundImage: `url(${message.sender.profilePicture ? 
                      (message.sender.profilePicture.startsWith('http') ? 
                        message.sender.profilePicture : 
                        `http://localhost:5000${message.sender.profilePicture}`) : 
                      '/default-avatar.png'
                    })` 
                  }}
                ></div>
              </div>
              <div className="message-bubble">
                <div className="message-content">{message.content}</div>
                <div className="message-time">{formatTime(message.createdAt)}</div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="typing-indicator">
            <span>{matchedUser?.name} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {error && <div className="chat-error">{error}</div>}
      
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;