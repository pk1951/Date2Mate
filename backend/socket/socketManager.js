const Message = require('../models/messageModel');
const Match = require('../models/matchModel');
const UserState = require('../models/userStateModel');

/**
 * Socket.io manager for handling real-time messaging
 * @param {Object} io - Socket.io server instance
 */
const initializeSocket = (io) => {
  // Store connected users to prevent duplicate connections
  const connectedUsers = new Map();
  
  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Store user connection info
    connectedUsers.set(socket.id, {
      userId: null,
      matchId: null,
      connectedAt: new Date()
    });
    
    // Join a chat room with authentication
    socket.on('join_chat', async (data) => {
      try {
        const { matchId, token } = data;
        
        if (!matchId) {
          console.log(`User ${socket.id} attempted to join without matchId`);
          return;
        }
        
        // Verify user is part of the match (simplified for now)
        // In production, you should verify the JWT token here
        
        // Leave previous room if any
        if (connectedUsers.get(socket.id)?.matchId) {
          socket.leave(connectedUsers.get(socket.id).matchId);
          console.log(`User ${socket.id} left previous room: ${connectedUsers.get(socket.id).matchId}`);
        }
        
        // Join new room
        socket.join(matchId);
        
        // Update user info
        connectedUsers.set(socket.id, {
          ...connectedUsers.get(socket.id),
          matchId: matchId
        });
        
        console.log(`User ${socket.id} joined chat: ${matchId}`);
        
        // Emit confirmation
        socket.emit('chat_joined', { matchId, success: true });
        
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('chat_join_error', { error: 'Failed to join chat' });
      }
    });
    
    // Handle messages
    socket.on('send_message', async (messageData) => {
      try {
        const { matchId, message, senderId } = messageData;
        
        if (!matchId || !message) {
          console.log(`Invalid message data from ${socket.id}`);
          return;
        }
        
        // Verify user is in the correct room
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo || userInfo.matchId !== matchId) {
          console.log(`User ${socket.id} not in room ${matchId}`);
          return;
        }
        
        // Emit the message to the room
        socket.to(matchId).emit('receive_message', {
          ...message,
          timestamp: new Date()
        });
        
        // Update match message count in database
        const match = await Match.findById(matchId);
        if (match) {
          // Check if milestone reached
          const milestoneReached = await match.checkMilestone();
          
          // If milestone just reached, notify all users in the room
          if (milestoneReached && !match.milestoneReached) {
            io.to(matchId).emit('milestone_reached', {
              matchId: matchId,
              milestoneReached: true
            });
          }
        }
        
        console.log(`Message sent in room ${matchId} by ${socket.id}`);
        
      } catch (error) {
        console.error('Socket error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      try {
        const { matchId, userId, isTyping } = data;
        
        if (!matchId || !userId) {
          return;
        }
        
        // Verify user is in the correct room
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo || userInfo.matchId !== matchId) {
          return;
        }
        
        socket.to(matchId).emit('user_typing', {
          matchId: matchId,
          userId: userId,
          isTyping: isTyping
        });
        
      } catch (error) {
        console.error('Typing indicator error:', error);
      }
    });
    
    // Handle video call signals
    socket.on('video_call_request', (data) => {
      try {
        const { matchId, caller } = data;
        
        if (!matchId || !caller) {
          return;
        }
        
        socket.to(matchId).emit('video_call_incoming', {
          matchId: matchId,
          caller: caller
        });
        
      } catch (error) {
        console.error('Video call request error:', error);
      }
    });
    
    socket.on('video_call_accepted', (data) => {
      try {
        const { matchId, signal } = data;
        
        if (!matchId) {
          return;
        }
        
        socket.to(matchId).emit('video_call_accepted', {
          matchId: matchId,
          signal: signal
        });
        
      } catch (error) {
        console.error('Video call accepted error:', error);
      }
    });
    
    socket.on('video_call_rejected', (data) => {
      try {
        const { matchId, reason } = data;
        
        if (!matchId) {
          return;
        }
        
        socket.to(matchId).emit('video_call_rejected', {
          matchId: matchId,
          reason: reason
        });
        
      } catch (error) {
        console.error('Video call rejected error:', error);
      }
    });
    
    socket.on('video_call_ended', (data) => {
      try {
        const { matchId } = data;
        
        if (!matchId) {
          return;
        }
        
        socket.to(matchId).emit('video_call_ended', {
          matchId: matchId
        });
        
      } catch (error) {
        console.error('Video call ended error:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
      
      // Clean up user data
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        console.log(`Cleaning up user ${socket.id} from room ${userInfo.matchId}`);
        connectedUsers.delete(socket.id);
      }
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
  
  // Log connection stats periodically
  setInterval(() => {
    console.log(`Active connections: ${connectedUsers.size}`);
  }, 30000); // Every 30 seconds
};

module.exports = initializeSocket;