const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const cmsController = require('../controllers/cmsController');
const { authenticateToken: protect, authorizeRole: authorize } = require('../middleware/auth');

const createPageValidation = [
  body('slug').notEmpty().trim().withMessage('Slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('published_status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  body('layout_template').optional().isIn(['default', 'full-width', 'with-sidebar', 'centered', 'landing']).withMessage('Invalid layout template'),
];

const updatePageValidation = [
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('published_status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  body('layout_template').optional().isIn(['default', 'full-width', 'with-sidebar', 'centered', 'landing']).withMessage('Invalid layout template'),
];

router.get('/pages/:slug', cmsController.getPageBySlug);

router.get('/pages', protect, authorize('admin', 'superadmin'), cmsController.getAllPages);
router.post('/pages', protect, authorize('admin', 'superadmin'), createPageValidation, validate, cmsController.createPage);
router.put('/pages/:id', protect, authorize('admin', 'superadmin'), updatePageValidation, validate, cmsController.updatePage);
router.delete('/pages/:id', protect, authorize('admin', 'superadmin'), cmsController.deletePage);

module.exports = router;
