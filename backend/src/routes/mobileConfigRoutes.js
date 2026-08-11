const express = require('express');
const router = express.Router();
const mobileConfigController = require('../controllers/mobileConfigController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route GET /api/mobile-config/public
 * @desc Get public mobile configurations (branding, maintenance status)
 * @access Public
 */
router.get('/public', mobileConfigController.getPublicConfig);

/**
 * @route GET /api/mobile-config/all
 * @desc Get all mobile configurations
 * @access Private (Admin/SuperAdmin)
 */
router.get('/all', authenticateToken, authorizeRole('admin', 'superadmin'), mobileConfigController.getAllConfigs);

/**
 * @route PUT /api/mobile-config/:key
 * @desc Update a mobile configuration
 * @access Private (SuperAdmin)
 */
router.put('/:key', authenticateToken, authorizeRole('superadmin'), mobileConfigController.updateConfig);

module.exports = router;
