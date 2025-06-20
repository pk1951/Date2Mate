# Date2Mate - Mindful Dating App

A mindful dating app that provides users with one carefully selected match per day based on deep compatibility factors like personality, emotional thinking, behavior, and relationship goals. The app encourages meaningful connections by limiting matches and incorporating reflection periods.

## Features

### Core Features
- **Daily Matching**: One carefully selected match per day
- **Deep Compatibility**: Based on personality, emotional patterns, and relationship goals
- **Real-time Chat**: Socket.io powered messaging with milestone tracking
- **Decision System**: Pin/unpin matches with reflection periods
- **Video Calling**: Unlocked after reaching 100 message milestone
- **Profile Management**: Comprehensive personality and preference assessment

### User States
- **Available**: Ready for new matches
- **Matched**: Has a daily match
- **Pinned**: Actively chatting with match
- **Unpinned**: Ended a match, entering reflection
- **Frozen**: In 24-hour reflection period

## Tech Stack

- **Frontend**: React.js with modern hooks and context
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.io
- **Authentication**: JWT tokens
- **Styling**: Custom CSS with responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mindful_dating
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/date2mate

# JWT Secret
JWT_SECRET=date2mate_super_secret_jwt_key_2024

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## Running the Application

### 1. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGO_URI in .env file
```

### 2. Start Backend Server
```bash
cd backend
npm start
# or for development with auto-restart
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Start Frontend Development Server
```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
mindful_dating/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── matchController.js  # Matching algorithm
│   │   └── messageController.js # Chat functionality
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT protection
│   ├── models/
│   │   ├── userModel.js        # User schema
│   │   ├── userStateModel.js   # User state management
│   │   ├── matchModel.js       # Match schema
│   │   └── messageModel.js     # Message schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── matchRoutes.js      # Match endpoints
│   │   └── messageRoutes.js    # Message endpoints
│   ├── socket/
│   │   └── socketManager.js    # Real-time communication
│   ├── server.js               # Express server
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── VideoCall.js    # Video calling component
│   │   ├── pages/
│   │   │   ├── Login.js        # Authentication
│   │   │   ├── Register.js     # User registration
│   │   │   ├── ProfileSetup.js # Profile creation
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── Chat.js         # Messaging interface
│   │   │   ├── DecisionScreen.js # Match decisions
│   │   │   └── Settings.js     # User settings
│   │   ├── styles/             # CSS files
│   │   ├── App.js              # Main app component
│   │   └── index.js            # Entry point
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Matching
- `GET /api/matches/daily` - Get daily match
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id/pin` - Pin a match
- `PUT /api/matches/:id/unpin` - Unpin a match

### Messaging
- `POST /api/messages` - Send a message
- `GET /api/messages/:matchId` - Get messages for a match
- `PUT /api/messages/:matchId/read` - Mark messages as read
- `GET /api/messages/:matchId/milestone` - Get milestone status

## Key Features Explained

### Matching Algorithm
The app uses a sophisticated compatibility algorithm that considers:
- Personality traits (introvert/extrovert, thinking/feeling, etc.)
- Emotional patterns (communication style, conflict resolution)
- Relationship preferences and goals
- Shared interests and values

### Milestone System
- Users must reach 100 messages to unlock video calling
- 48-hour time limit for reaching the milestone
- Progress tracking with visual indicators

### Reflection Period
- 24-hour reflection period after unpinning a match
- Prompts for self-reflection and growth
- Prevents immediate re-matching for thoughtful decisions

## Development

### Adding New Features
1. Backend: Add routes, controllers, and models as needed
2. Frontend: Create new components and pages
3. Update navigation and routing
4. Add appropriate styling

### Database Schema
The app uses MongoDB with the following main collections:
- `users`: User profiles and preferences
- `userstates`: Current user state and match history
- `matches`: Match records and compatibility scores
- `messages`: Chat messages with milestone tracking

## Deployment

### Backend Deployment
1. Set up MongoDB Atlas or other cloud database
2. Update environment variables for production
3. Deploy to Heroku, Vercel, or similar platform

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to Netlify, Vercel, or similar platform
3. Update API endpoints for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.