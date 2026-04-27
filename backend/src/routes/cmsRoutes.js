const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { authenticateToken: protect, authorizeRole: authorize } = require('../middleware/auth');

// Public route for frontend fetching
router.get('/pages/:slug', cmsController.getPageBySlug);

// Protected Admin Routes
// We use a generic get to list them all for the admin dashboard
router.get('/pages', protect, authorize('admin', 'superadmin'), cmsController.getAllPages);
router.post('/pages', protect, authorize('admin', 'superadmin'), cmsController.createPage);
router.put('/pages/:id', protect, authorize('admin', 'superadmin'), cmsController.updatePage);
router.delete('/pages/:id', protect, authorize('admin', 'superadmin'), cmsController.deletePage);

module.exports = router;
