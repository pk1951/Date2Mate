# Backend Deployment Configuration

## Environment Variables Required:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindful_dating
JWT_SECRET=your_secure_jwt_secret_key_here
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## Deployment Steps:

1. **MongoDB Atlas Setup:**
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get your connection string
   - Replace `MONGODB_URI` with your Atlas connection string

2. **Backend Hosting (Choose one):**
   - **Render:** Free tier available, easy deployment
   - **Railway:** Good free tier, simple setup
   - **Heroku:** Paid service, reliable
   - **DigitalOcean App Platform:** Good performance

3. **File Upload Storage:**
   - For production, consider using cloud storage (AWS S3, Cloudinary)
   - Update upload middleware to use cloud storage instead of local files

## Recommended: Render Deployment

1. Go to render.com and sign up
2. Connect your GitHub repository
3. Create a new Web Service
4. Set environment variables
5. Deploy

## File Upload for Production

For production, you should use cloud storage instead of local files. Consider:
- AWS S3
- Cloudinary
- Firebase Storage 