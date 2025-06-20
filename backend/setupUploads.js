const fs = require('fs');
const path = require('path');

const setupUploads = () => {
  try {
    // Create uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log('Created uploads directory');
    }

    // Create profile-pictures subdirectory
    const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');
    if (!fs.existsSync(profilePicturesDir)) {
      fs.mkdirSync(profilePicturesDir);
      console.log('Created profile-pictures directory');
    }

    console.log('Uploads directory structure created successfully!');
    console.log('Directories created:');
    console.log('- uploads/');
    console.log('- uploads/profile-pictures/');
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};

setupUploads(); 