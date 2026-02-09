const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// POST /api/upload/classify - Upload image and get AI classification
const AIClassificationService = require('../services/AIClassificationService');

router.post('/classify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }

    // Get AI classification for the uploaded image
    const imagePath = req.file.path;
    const originalCategory = req.body.category || null; // Optional user hint
    
    try {
      const aiClassification = await AIClassificationService.classifyIssueFromImage(
        imagePath,
        originalCategory
      );
      
      res.json({
        success: true,
        data: {
          image: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`,
            fullUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
          },
          aiClassification: {
            category: aiClassification.verified_category,
            confidence: aiClassification.confidence_score,
            explanation: aiClassification.ai_explanation,
            needsReview: aiClassification.needs_review,
            wasReclassified: aiClassification.was_reclassified,
            reclassificationEvent: aiClassification.reclassification_event
          }
        }
      });
      
    } catch (aiError) {
      console.error('❌ AI classification failed:', aiError.message);
      
      // Provide more specific error messages
      let userFriendlyError = 'AI classification failed';
      if (aiError.message.includes('GEMINI_API_KEY')) {
        userFriendlyError = 'AI service not configured - missing API key';
      } else if (aiError.message.includes('API')) {
        userFriendlyError = 'AI service temporarily unavailable';
      } else if (aiError.message.includes('quota')) {
        userFriendlyError = 'AI service quota exceeded';
      }
      
      // Return image upload success with fallback classification
      res.json({
        success: true,
        data: {
          image: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`,
            fullUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
          },
          aiClassification: {
            category: originalCategory || 'other',
            confidence: 0.1,
            explanation: userFriendlyError + ' - manual selection required',
            needsReview: true,
            wasReclassified: false,
            error: userFriendlyError
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Upload and classify error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload and classify image'
    });
  }
});

// POST /api/upload/image - Single image upload (legacy)
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image provided',
        message: 'Please select an image file to upload'
      });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
        fullUrl: `${baseUrl}${imageUrl}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

// POST /api/upload/images - Multiple image upload
router.post('/images', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided',
        message: 'Please select at least one image file to upload'
      });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedImages = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
      fullUrl: `${baseUrl}/uploads/${file.filename}`
    }));
    
    res.json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      data: uploadedImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

// DELETE /api/upload/:filename - Delete uploaded file
router.delete('/:filename', authenticateToken, requireAnyRole(['admin', 'super_admin']), (req, res) => {
  try {
    // Sanitize filename to prevent path traversal
    const filename = path.basename(req.params.filename);
    const filepath = path.join(uploadsDir, filename);
    
    // Double check the resolved path is within uploads directory
    if (!filepath.startsWith(uploadsDir)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: `File ${filename} does not exist`
      });
    }
    
    // Delete file
    fs.unlinkSync(filepath);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      data: { filename }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'File deletion failed',
      message: error.message
    });
  }
});

// GET /api/upload/list - List all uploaded files
router.get('/list', authenticateToken, requireAnyRole(['admin', 'super_admin']), (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    
    const fileList = files.map(filename => {
      const filepath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filepath);
      
      return {
        filename,
        size: stats.size,
        uploadedAt: stats.birthtime,
        url: `/uploads/${filename}`,
        fullUrl: `/uploads/${filename}`
      };
    });
    
    res.json({
      success: true,
      message: `Found ${fileList.length} uploaded file(s)`,
      data: fileList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum is 5 files.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        break;
      default:
        message = error.message;
    }
    
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: message
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;