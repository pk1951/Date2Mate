const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  console.log('Processing file upload:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('Only image files are allowed (JPEG, PNG, GIF)');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('profilePicture');

// Wrapper to handle multer errors
const uploadMiddleware = (req, res, next) => {
  console.log('Starting file upload...');
  
  upload(req, res, (err) => {
    if (err) {
      console.error('File upload error:', {
        error: err,
        code: err.code,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          success: false,
          message: 'File size too large. Maximum size is 5MB.' 
        });
      }
      
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(415).json({
          success: false,
          message: err.message || 'Invalid file type. Only image files are allowed.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file',
        code: err.code || 'UPLOAD_ERROR'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded'
      });
    }
    
    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
    
    next();
  });
};

module.exports = uploadMiddleware; 