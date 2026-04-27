const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getSettings, updateSettings } = require('../controllers/websiteSettingsController');
const { authenticateToken: protect, authorizeRole: authorizeRoles } = require('../middleware/auth');

// Configure multer storage for website images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/website');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // e.g. hero_image-1623847293.png
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Public route to get settings
router.get('/', getSettings);

// Protected route for super admin to update settings
router.put('/', protect, authorizeRoles('admin'), upload.fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]), updateSettings);

module.exports = router;
