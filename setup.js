#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Date2Mate - Mindful Dating App Setup');
console.log('=====================================\n');

// Check if .env file exists in backend
const envPath = path.join(__dirname, 'backend', '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ Environment file already exists');
} else {
  console.log('📝 Creating environment file...');
  
  const envContent = `# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/date2mate

# JWT Secret
JWT_SECRET=date2mate_super_secret_jwt_key_2024

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL=http://localhost:3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created successfully');
}

console.log('\n📋 Setup Instructions:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Install backend dependencies: cd backend && npm install');
console.log('3. Install frontend dependencies: cd frontend && npm install');
console.log('4. Start backend server: cd backend && npm start');
console.log('5. Start frontend server: cd frontend && npm start');
console.log('6. Open http://localhost:3000 in your browser');

console.log('\n🎯 Quick Start Commands:');
console.log('cd backend && npm install && npm start');
console.log('cd frontend && npm install && npm start');

console.log('\n✨ Happy coding with Date2Mate!'); 