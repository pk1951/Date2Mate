# Socket.io Implementation for Mindful Dating App

## Overview

This directory contains the Socket.io implementation for real-time features in the Mindful Dating App, including:

- Real-time messaging
- Typing indicators
- Message milestone tracking
- Video call signaling

## Architecture

The Socket.io implementation follows a modular approach:

- `socketManager.js`: Main module that initializes and manages all socket connections and events
- Integration with Express server in `server.js`

## Socket Events

### Connection Events

- `connection`: Triggered when a user connects to the socket server
- `disconnect`: Triggered when a user disconnects from the socket server

### Chat Events

- `join_chat`: User joins a specific chat room (match ID)
- `send_message`: User sends a message to a match
- `receive_message`: User receives a message from a match
- `typing`: User is typing a message
- `user_typing`: Notifies other user that someone is typing

### Milestone Events

- `milestone_reached`: Notifies users when they've reached the 100-message milestone

### Video Call Events

- `video_call_request`: User initiates a video call
- `video_call_incoming`: User receives an incoming video call
- `video_call_accepted`: User accepts an incoming video call
- `video_call_rejected`: User rejects an incoming video call
- `video_call_ended`: User ends an active video call

## Implementation Details

### Room Management

Each match between users creates a unique chat room identified by the match ID. When users open a chat, they join the corresponding room to receive real-time updates.

### Message Handling

Messages are first saved to the database through the REST API, then broadcast to the appropriate room via Socket.io. This ensures message persistence even if users are offline.

### Milestone Tracking

The socket server monitors message counts and broadcasts milestone achievements to both users when they reach 100 messages, unlocking video call functionality.

### Video Call Signaling

The socket implementation provides the signaling mechanism for WebRTC video calls. The actual media streaming would be handled by WebRTC in a production environment.

## Future Enhancements

1. Implement full WebRTC integration for video calls
2. Add read receipts for messages
3. Support for image and voice messages
4. Group chat functionality for potential future features

## Usage Example

```javascript
// Server-side (already implemented)
const initializeSocket = require('./socket/socketManager');
initializeSocket(io);

// Client-side (example usage in React component)
const socket = io('http://localhost:5000');

// Join a chat room
socket.emit('join_chat', matchId);

// Send a message
socket.emit('send_message', { matchId, message });

// Listen for incoming messages
socket.on('receive_message', (message) => {
  // Update UI with new message
});
```