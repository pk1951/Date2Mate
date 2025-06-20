const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();
const path = require('path');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  // Production and preview URLs
  'https://date2-mate.vercel.app',
  'https://date2-mate-git-main-pes2ug22cs413s-projects.vercel.app',
  'https://date2-mate-jp5vjqtcc-pes2ug22cs413s-projects.vercel.app',
  
  // Pattern for any Vercel preview deployments
  'https://date2-mate-*.vercel.app',
  'https://date2-mate-*-pes2ug22cs413s-projects.vercel.app',
  
  // Local development
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Log the origin for debugging
    console.log('CORS check for origin:', origin);
    
    // Check if the origin is in the allowed list or matches any pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Direct match
      if (allowedOrigin === origin) return true;
      
      // Wildcard pattern matching
      if (allowedOrigin.includes('*')) {
        // Escape special regex chars except *
        const escaped = allowedOrigin
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*');
        const pattern = new RegExp(`^${escaped}$`);
        return pattern.test(origin);
      }
      
      return false;
    });
    
    if (!isAllowed) {
      const msg = `CORS: Origin '${origin}' not allowed. Allowed origins: ${allowedOrigins.join(', ')}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    
    console.log('CORS: Allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  maxAge: 600, // Cache preflight request for 10 minutes
  optionsSuccessStatus: 204 // Return 204 for OPTIONS requests
};

// Handle preflight requests
app.options('*', cors(corsOptions));

// Set up Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      console.log('Socket.IO CORS check for origin:', origin);
      
      // Check if the origin is in the allowed list or matches any pattern
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        // Direct match
        if (allowedOrigin === origin) return true;
        
        // Wildcard pattern matching
        if (allowedOrigin.includes('*')) {
          // Escape special regex chars except *
          const escaped = allowedOrigin
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*');
          const pattern = new RegExp(`^${escaped}$`);
          return pattern.test(origin);
        }
        
        return false;
      });
      
      if (isAllowed) {
        console.log('Socket.IO CORS: Allowed origin:', origin);
        callback(null, true);
      } else {
        const msg = `Socket.IO CORS: Origin '${origin}' not allowed`;
        console.warn(msg);
        callback(new Error(msg));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'Authorization'],
    // Additional WebSocket settings
    cors: {
      origin: true, // Reflect the request origin
      credentials: true
    },
    // Enable compatibility with older Socket.IO clients
    allowEIO3: true,
    // Increase timeout for long polling
    pingTimeout: 60000,
    pingInterval: 25000
  },
  // Transport settings
  transports: ['websocket', 'polling'],
  // Maximum buffer size for messages
  maxHttpBufferSize: 1e8, // 100 MB
  // Enable HTTP long-polling
  serveClient: false,
  // Path for Socket.IO
  path: '/socket.io/'
});

// Apply CORS to all routes
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Socket.io with the socket manager
const initializeSocket = require('./socket/socketManager');
initializeSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  
  // Handle CORS errors
  if (err.message.includes('CORS') || err.message.includes('cors')) {
    console.error('CORS Error Details:', {
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins
    });
    return res.status(403).json({ 
      message: 'Not allowed by CORS',
      error: err.message 
    });
  }
  
  // Handle other errors
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});