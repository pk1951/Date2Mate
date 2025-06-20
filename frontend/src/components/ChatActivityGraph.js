import React from 'react';
import { FaComments, FaHeart } from 'react-icons/fa';
import '../styles/ChatActivityGraph.css';

const ChatActivityGraph = ({ matchData, messageCount, totalHours, activityData }) => {
  // Use real activity data if provided, otherwise generate sample data
  const getActivityData = () => {
    if (activityData && activityData.length > 0) {
      return activityData;
    }
    
    // Fallback to sample data if no real data available
    const hours = 24;
    const data = [];
    
    for (let i = 0; i < hours; i++) {
      let activity = 0;
      const hour = (new Date().getHours() - i + 24) % 24;
      
      if (hour >= 18 || hour <= 2) {
        activity = Math.floor(Math.random() * 15) + 5;
      } else if (hour >= 12 && hour <= 17) {
        activity = Math.floor(Math.random() * 10) + 2;
      } else {
        activity = Math.floor(Math.random() * 5) + 1;
      }
      
      const remainingMessages = messageCount - data.reduce((sum, item) => sum + item.activity, 0);
      if (remainingMessages <= 0) {
        activity = 0;
      } else if (activity > remainingMessages) {
        activity = remainingMessages;
      }
      
      data.unshift({
        hour: hour,
        activity: activity,
        timeLabel: `${hour}:00`
      });
    }
    
    return data;
  };

  const finalActivityData = getActivityData();
  const maxActivity = Math.max(...finalActivityData.map(d => d.activity));

  // Generate real insights based on activity data
  const generateInsights = () => {
    if (!finalActivityData || finalActivityData.length === 0) {
      return {
        peakHours: 'No activity data',
        mostActive: 'No messages yet',
        connectionQuality: 'No data available'
      };
    }

    // Find peak hours (hours with highest activity)
    const sortedByActivity = [...finalActivityData].sort((a, b) => b.activity - a.activity);
    const peakHour = sortedByActivity[0];
    const peakHours = `${peakHour.hour}:00 - ${(peakHour.hour + 1) % 24}:00`;

    // Determine most active period
    let mostActive = 'Evening conversations';
    const eveningActivity = finalActivityData.filter(d => d.hour >= 18 || d.hour <= 2).reduce((sum, d) => sum + d.activity, 0);
    const afternoonActivity = finalActivityData.filter(d => d.hour >= 12 && d.hour <= 17).reduce((sum, d) => sum + d.activity, 0);
    const morningActivity = finalActivityData.filter(d => d.hour >= 6 && d.hour <= 11).reduce((sum, d) => sum + d.activity, 0);

    if (afternoonActivity > eveningActivity && afternoonActivity > morningActivity) {
      mostActive = 'Afternoon conversations';
    } else if (morningActivity > eveningActivity && morningActivity > afternoonActivity) {
      mostActive = 'Morning conversations';
    }

    // Determine connection quality based on total messages and consistency
    const totalMessages = finalActivityData.reduce((sum, d) => sum + d.activity, 0);
    const activeHours = finalActivityData.filter(d => d.activity > 0).length;
    let connectionQuality = 'Strong engagement';
    
    if (totalMessages < 10) {
      connectionQuality = 'Getting to know each other';
    } else if (totalMessages < 30) {
      connectionQuality = 'Good conversation flow';
    } else if (activeHours < 6) {
      connectionQuality = 'Focused conversations';
    }

    return {
      peakHours,
      mostActive,
      connectionQuality
    };
  };

  const insights = generateInsights();

  return (
    <div className="chat-activity-graph">
      <div className="graph-header">
        <div className="graph-title">
          <FaComments className="graph-icon" />
          <h4>Chat Activity Timeline</h4>
        </div>
        <div className="graph-stats">
          <div className="stat-item">
            <span className="stat-label">Total Messages:</span>
            <span className="stat-value">{messageCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Chat Duration:</span>
            <span className="stat-value">{totalHours}h</span>
          </div>
        </div>
      </div>
      
      <div className="graph-container">
        <div className="graph-bars">
          {finalActivityData.map((data, index) => (
            <div key={index} className="bar-container">
              <div 
                className={`activity-bar ${data.activity > 0 ? 'has-activity' : ''}`}
                style={{ 
                  height: `${data.activity > 0 ? (data.activity / maxActivity) * 100 : 2}%`,
                  backgroundColor: data.activity > 0 ? 
                    `hsl(${200 + (data.activity / maxActivity) * 60}, 70%, 60%)` : 
                    '#e0e0e0'
                }}
              >
                {data.activity > 0 && (
                  <span className="bar-tooltip">{data.activity} msgs</span>
                )}
              </div>
              <span className="time-label">{data.timeLabel}</span>
            </div>
          ))}
        </div>
        
        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-color high"></div>
            <span>High Activity</span>
          </div>
          <div className="legend-item">
            <div className="legend-color medium"></div>
            <span>Medium Activity</span>
          </div>
          <div className="legend-item">
            <div className="legend-color low"></div>
            <span>Low Activity</span>
          </div>
        </div>
      </div>
      
      <div className="activity-insights">
        <h5>Activity Insights</h5>
        <div className="insights-grid">
          <div className="insight-card">
            <FaHeart className="insight-icon" />
            <div className="insight-content">
              <h6>Peak Hours</h6>
              <p>{insights.peakHours}</p>
            </div>
          </div>
          <div className="insight-card">
            <FaComments className="insight-icon" />
            <div className="insight-content">
              <h6>Most Active</h6>
              <p>{insights.mostActive}</p>
            </div>
          </div>
          <div className="insight-card">
            <FaHeart className="insight-icon" />
            <div className="insight-content">
              <h6>Connection Quality</h6>
              <p>{insights.connectionQuality}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatActivityGraph; 