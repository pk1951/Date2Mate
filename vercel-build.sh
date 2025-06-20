#!/bin/bash

# Exit on error
set -e

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Build the frontend
echo "Building frontend..."
npm run build

# Move build files to the expected location
echo "Moving build files..."
cd ..
mkdir -p .vercel/output/static
cp -r frontend/build/* .vercel/output/static/

# Create the config file
echo '{
  "version": 3,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/(.*)", "dest": "https://date2mate.onrender.com/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}' > .vercel/output/config.json

echo "Build completed successfully!"
