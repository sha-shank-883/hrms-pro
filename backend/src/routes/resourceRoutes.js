const express = require('express');
const router = express.Router();
const { getResources, getPublishedResources, getResourceBySlug, createResource, updateResource, deleteResource } = require('../controllers/resourceController');
const { authenticateToken: protect, authorizeRole: authorizeRoles } = require('../middleware/auth');

// Public routes
router.get('/published', getPublishedResources);
router.get('/s/:slug', getResourceBySlug);

// Admin routes
router.get('/', protect, authorizeRoles('admin'), getResources);
router.post('/', protect, authorizeRoles('admin'), createResource);
router.put('/:id', protect, authorizeRoles('admin'), updateResource);
router.delete('/:id', protect, authorizeRoles('admin'), deleteResource);

module.exports = router;
