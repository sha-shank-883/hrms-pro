const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const blogController = require('../controllers/blogController');
const { authenticateToken: protect, authorizeRole: authorize } = require('../middleware/auth');

const createValidation = [
  body('slug').notEmpty().withMessage('Slug is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('content_html').notEmpty().withMessage('Content is required'),
];

// Public routes
router.get('/published', blogController.getPublishedPosts);
router.get('/published/:slug', blogController.getPostBySlug);
router.get('/:id', blogController.getPostById);

// Protected admin routes
router.get('/', protect, authorize('admin', 'superadmin'), blogController.getAllPosts);
router.post('/', protect, authorize('admin', 'superadmin'), createValidation, validate, blogController.createPost);
router.put('/:id', protect, authorize('admin', 'superadmin'), blogController.updatePost);
router.delete('/:id', protect, authorize('admin', 'superadmin'), blogController.deletePost);

module.exports = router;
