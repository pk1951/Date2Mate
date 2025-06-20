# Deployment Guide

## Backend (Render)

1. Make sure your backend is deployed on Render
2. Set the following environment variables in your Render dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secret key for JWT token generation
   - `NODE_ENV`: Set to `production`
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://your-frontend.vercel.app`)

## Frontend (Vercel)

1. Create a new file called `.env` in the `frontend` directory with the following content:
   ```
   REACT_APP_API_URL=https://your-render-backend-url.onrender.com
   ```
   Replace `https://your-render-backend-url.onrender.com` with your actual Render backend URL.

2. If deploying to Vercel, add the environment variable in the Vercel project settings:
   - Go to your project in Vercel
   - Navigate to Settings > Environment Variables
   - Add a new environment variable:
     - Name: `REACT_APP_API_URL`
     - Value: `https://your-render-backend-url.onrender.com`

3. Rebuild and redeploy your frontend after making these changes.

## Local Development

For local development, you can create a `.env` file in the `frontend` directory with:
```
REACT_APP_API_URL=http://localhost:5000
```

And in the `backend` directory, create a `.env` file with:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
PORT=5000
```

## Verifying the Setup

1. Start your backend server locally or ensure your Render backend is running
2. Start your frontend with `npm start` in the frontend directory
3. Try to register a new account or log in with existing credentials
4. Check the browser's developer console (F12) for any errors
5. Check the network tab to ensure API requests are being made to the correct URL
