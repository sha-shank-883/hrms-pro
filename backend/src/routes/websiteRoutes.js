const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/websiteController');
const themeCtrl = require('../controllers/websiteThemeController');
const labelCtrl = require('../controllers/websiteLabelController');
const { authenticateToken: protect, authorizeRole: authorize, requireSuperAdmin } = require('../middleware/auth');

// Media upload config
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/media');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
  }
});
const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else cb(new Error('Only images, videos, and PDFs allowed'));
  }
});

// Website upload config (logo, favicon)
const webStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/website');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const webUpload = multer({
  storage: webStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// ───── PUBLIC ROUTES ─────
router.get('/pages/home', ctrl.getHomepage);
router.get('/pages/public/:slug', ctrl.getPublishedPage);
router.get('/global-settings/public', ctrl.getPublicGlobalSettings);
router.get('/themes/active', themeCtrl.getActiveTheme);
router.get('/labels/public', labelCtrl.getPublicLabels);

// ───── PROTECTED ROUTES (admin only) ─────
router.use(protect, authorize('admin', 'superadmin'), requireSuperAdmin);

// Pages
router.get('/pages', ctrl.getAllPages);
router.post('/pages',
  body('slug').notEmpty().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug'),
  body('title').notEmpty().trim(),
  validate, ctrl.createPage);
router.get('/pages/:id', ctrl.getPageById);
router.put('/pages/:id', ctrl.updatePage);
router.delete('/pages/:id', ctrl.deletePage);

// Sections
router.get('/pages/:pageId/sections', ctrl.getSections);
router.post('/pages/:pageId/sections',
  body('section_type').notEmpty().trim(),
  validate, ctrl.addSection);
router.put('/sections/reorder/:pageId', ctrl.reorderSections);
router.put('/sections/:id', ctrl.updateSection);
router.delete('/sections/:id', ctrl.deleteSection);

// Media
router.post('/media/upload', mediaUpload.single('file'), ctrl.uploadMedia);
router.get('/media', ctrl.getAllMedia);
router.delete('/media/:id', ctrl.deleteMedia);

// Global Settings
router.get('/global-settings', ctrl.getGlobalSettings);
router.put('/global-settings',
  webUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  ctrl.updateGlobalSettings);

// Themes (admin only)
router.get('/themes', themeCtrl.getAllThemes);
router.post('/themes',
  body('name').notEmpty().trim(),
  body('slug').notEmpty().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid theme slug'),
  validate, themeCtrl.createTheme);
router.post('/themes/:id/activate', themeCtrl.activateTheme);
router.get('/themes/:id', themeCtrl.getThemeById);
router.put('/themes/:id', themeCtrl.updateTheme);
router.delete('/themes/:id', themeCtrl.deleteTheme);

// Labels (admin only)
router.get('/labels', labelCtrl.getAllLabels);
router.post('/labels',
  body('namespace').notEmpty().trim(),
  body('label_key').notEmpty().trim(),
  validate, labelCtrl.createLabel);
router.post('/labels/bulk', labelCtrl.bulkUpdateLabels);
router.get('/labels/:id', labelCtrl.getLabelById);
router.put('/labels/:id', labelCtrl.updateLabel);
router.delete('/labels/:id', labelCtrl.deleteLabel);

module.exports = router;
