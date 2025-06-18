import React, { useState, useEffect, useRef } from 'react';
import '../styles/VideoCall.css';

/**
 * VideoCall component for handling video calls between matched users
 * This is a placeholder implementation that would be integrated with a WebRTC solution
 */
const VideoCall = ({ matchId, matchedUser, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Initialize local video stream
  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // In a real implementation, this would connect to a WebRTC service
        // and establish a peer connection
        
        // Simulate connecting to remote peer after 2 seconds
        setTimeout(() => {
          setCallStatus('connected');
          // In a real implementation, this would be the actual remote stream
          setRemoteStream(stream);
          
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        }, 2000);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera or microphone. Please check permissions.');
        onEndCall();
      }
    };
    
    startLocalStream();
    
    // Cleanup function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (remoteStream && remoteStream !== localStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // End call
  const endCall = () => {
    setCallStatus('ended');
    
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (remoteStream && remoteStream !== localStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    
    onEndCall();
  };
  
  return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="remote-video-container">
          {callStatus === 'connecting' && (
            <div className="connecting-overlay">
              <div className="connecting-spinner"></div>
              <p>Connecting to {matchedUser?.name}...</p>
            </div>
          )}
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />
          <div className="remote-user-name">{matchedUser?.name}</div>
        </div>
        
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            className="local-video"
            autoPlay
            playsInline
            muted // Always mute local video to prevent feedback
          />
          <div className="local-user-name">You</div>
        </div>
      </div>
      
      <div className="video-controls">
        <button 
          className={`control-button ${isMuted ? 'active' : ''}`}
          onClick={toggleMute}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        
        <button 
          className={`control-button ${isVideoOff ? 'active' : ''}`}
          onClick={toggleVideo}
        >
          {isVideoOff ? 'Show Video' : 'Hide Video'}
        </button>
        
        <button 
          className="control-button end-call"
          onClick={endCall}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCall;