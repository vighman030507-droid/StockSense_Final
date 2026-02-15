const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * MULTER CONFIGURATION FOR EXCEL UPLOADS
 * 
 * Security & Safety:
 * - Max file size: 10MB
 * - Only Excel files (.xlsx, .xls)
 * - Files stored temporarily with unique names
 * - Automatic cleanup after processing
 */

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-original.xlsx
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

// File filter - only Excel files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only Excel files (.xlsx, .xls) are allowed. Got: ${ext}`), false);
  }
};

// Multer instance with limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1 // Only one file at a time
  }
});

/**
 * Cleanup uploaded file
 * Call this after processing is complete or on error
 */
const cleanupFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error.message);
  }
};

/**
 * Cleanup old uploaded files (older than 1 hour)
 * Call this periodically or on server start
 */
const cleanupOldFiles = () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return;
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old files:', error.message);
  }
};

// Run cleanup on startup
cleanupOldFiles();

// Schedule cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

module.exports = {
  upload,
  cleanupFile,
  cleanupOldFiles,
  UPLOAD_DIR
};
