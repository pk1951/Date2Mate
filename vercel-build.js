const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Vercel build...');

// Change to frontend directory and install dependencies
console.log('Installing frontend dependencies...');
execSync('cd frontend && npm install', { stdio: 'inherit' });

// Build the frontend
console.log('Building frontend...');
execSync('cd frontend && npm run build', { stdio: 'inherit' });

console.log('Build completed successfully!');
