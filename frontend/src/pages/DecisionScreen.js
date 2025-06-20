import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/DecisionScreen.css';

const DecisionScreen = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUnpinDialog, setShowUnpinDialog] = useState(false);
  const [unpinReason, setUnpinReason] = useState('not_compatible');
  const [unpinDetails, setUnpinDetails] = useState('');

  const fetchMatchDetails = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/matches/${matchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch match details');
      }

      setMatch(data.match);
      setMatchedUser(data.matchedUser);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [matchId, navigate]);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId, fetchMatchDetails]);

  const handleUnpinMatch = async () => {
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
        body: JSON.stringify({ reason: unpinReason, details: unpinDetails }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unpin match');
      }

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleContinueChat = () => {
    navigate(`/chat/${matchId}`);
  };

  if (loading) {
    return (
      <div className="decision-container">
        <div className="loading-spinner"></div>
        <p>Loading match details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="decision-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="decision-container">
      <div className="decision-header">
        <h1>Decision Time</h1>
        <p>You've been chatting with {matchedUser?.name} for a while now.</p>
        <p>It's time to decide what you'd like to do next.</p>
      </div>

      <div className="match-summary">
        <div className="user-card">
          <div className="user-avatar">
            {matchedUser?.profilePicture ? (
              <img src={matchedUser.profilePicture} alt={matchedUser.name} />
            ) : (
              <div className="avatar-placeholder">
                {matchedUser?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-info">
            <h2>{matchedUser?.name}, {matchedUser?.age}</h2>
            <p className="location">{matchedUser?.location}</p>
            {matchedUser?.bio && <p className="bio">{matchedUser.bio}</p>}
            <div className="compatibility-score">
              <span>Compatibility: {match?.compatibilityScore}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="decision-options">
        <div className="option-card pin-option">
          <h3>Continue Chatting</h3>
          <p>Keep the conversation going and see where it leads.</p>
          <ul>
            <li>Continue building your connection</li>
            <li>Unlock video calling after 100 messages</li>
            <li>Take your time to get to know each other</li>
          </ul>
          <button onClick={handleContinueChat} className="pin-button">
            Continue Chatting
          </button>
        </div>

        <div className="option-card unpin-option">
          <h3>End This Match</h3>
          <p>If this isn't the right connection for you, that's okay.</p>
          <ul>
            <li>You'll enter a 24-hour reflection period</li>
            <li>After reflection, you'll get a new match</li>
            <li>Your feedback helps improve future matches</li>
          </ul>
          <button 
            onClick={() => setShowUnpinDialog(true)} 
            className="unpin-button"
          >
            End Match
          </button>
        </div>
      </div>

      {/* Unpin Confirmation Dialog */}
      {showUnpinDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>End This Match?</h3>
            <p>Please let us know why you're ending this match. This helps us improve your future matches.</p>
            
            <div className="form-group">
              <label>Reason for ending match:</label>
              <select 
                value={unpinReason} 
                onChange={(e) => setUnpinReason(e.target.value)}
              >
                <option value="not_compatible">Not compatible</option>
                <option value="no_chemistry">No chemistry</option>
                <option value="communication_issues">Communication issues</option>
                <option value="different_goals">Different goals</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Additional details (optional):</label>
              <textarea
                value={unpinDetails}
                onChange={(e) => setUnpinDetails(e.target.value)}
                placeholder="Tell us more about your decision..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowUnpinDialog(false)} 
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnpinMatch} 
                className="confirm-unpin-button"
              >
                End Match
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="decision-footer">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default DecisionScreen; 