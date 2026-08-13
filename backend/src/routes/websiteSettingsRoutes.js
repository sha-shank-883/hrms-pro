const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { getSettings, updateSettings } = require('../controllers/websiteSettingsController');
const { authenticateToken: protect, authorizeRole: authorizeRoles, requireSuperAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/website');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

const updateValidation = [
  body('primary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Primary color must be a valid hex color'),
  body('font_family').optional().trim().notEmpty().withMessage('Font family cannot be empty'),
  body('company_name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('contact_email').optional().isEmail().withMessage('Contact email must be valid'),
  body('contact_phone').optional().trim(),
  body('contact_address').optional().trim(),
  body('tagline').optional().trim(),
  body('copyright_text').optional().trim(),
  body('header_links').optional().isJSON().withMessage('header_links must be a valid JSON string'),
  body('footer_columns').optional().isJSON().withMessage('footer_columns must be a valid JSON string'),
  body('sections').optional().isJSON().withMessage('sections must be a valid JSON string'),
  body('social_links').optional().isJSON().withMessage('social_links must be a valid JSON string'),
  body('theme_mode').optional().isIn(['light', 'dark']).withMessage('Invalid theme mode'),
  body('primary_gradient').optional().trim(),
  body('glassmorphism_enabled').optional().toBoolean(),
];

router.get('/', getSettings);

router.put('/', protect, authorizeRoles('admin'), requireSuperAdmin, upload.fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]), updateValidation, validate, updateSettings);

module.exports = router;
