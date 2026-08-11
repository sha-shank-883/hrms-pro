const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/websiteController');
const { authenticateToken: protect, authorizeRole: authorize } = require('../middleware/auth');

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

// ───── PROTECTED ROUTES (admin only) ─────

// Pages
router.get('/pages', protect, authorize('admin', 'superadmin'), ctrl.getAllPages);
router.post('/pages', protect, authorize('admin', 'superadmin'),
  body('slug').notEmpty().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug'),
  body('title').notEmpty().trim(),
  validate, ctrl.createPage);
router.get('/pages/:id', protect, authorize('admin', 'superadmin'), ctrl.getPageById);
router.put('/pages/:id', protect, authorize('admin', 'superadmin'), ctrl.updatePage);
router.delete('/pages/:id', protect, authorize('admin', 'superadmin'), ctrl.deletePage);

// Sections
router.get('/pages/:pageId/sections', protect, authorize('admin', 'superadmin'), ctrl.getSections);
router.post('/pages/:pageId/sections', protect, authorize('admin', 'superadmin'),
  body('section_type').notEmpty().trim(),
  validate, ctrl.addSection);
router.put('/sections/reorder/:pageId', protect, authorize('admin', 'superadmin'), ctrl.reorderSections);
router.put('/sections/:id', protect, authorize('admin', 'superadmin'), ctrl.updateSection);
router.delete('/sections/:id', protect, authorize('admin', 'superadmin'), ctrl.deleteSection);

// Media
router.post('/media/upload', protect, authorize('admin', 'superadmin'), mediaUpload.single('file'), ctrl.uploadMedia);
router.get('/media', protect, authorize('admin', 'superadmin'), ctrl.getAllMedia);
router.delete('/media/:id', protect, authorize('admin', 'superadmin'), ctrl.deleteMedia);

// Global Settings
router.get('/global-settings', protect, authorize('admin', 'superadmin'), ctrl.getGlobalSettings);
router.put('/global-settings', protect, authorize('admin', 'superadmin'),
  webUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  ctrl.updateGlobalSettings);

module.exports = router;
