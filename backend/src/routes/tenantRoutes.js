const express = require('express');
const router = express.Router();
const { createTenant, getAllTenants, updateTenant, resetTenantAdminPassword, deleteTenant, getBiometricDevices, registerBiometricDevice, deleteBiometricDevice } = require('../controllers/tenantController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Middleware to check if user is super admin (tenant_default)
const requireSuperAdmin = (req, res, next) => {
    // Check if tenant is default
    if (req.tenant && req.tenant.tenant_id === 'tenant_default') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access denied. Only Super Admin (tenant_default) can perform this action.'
    });
};

router.post('/', authenticateToken, authorizeRole('admin'), requireSuperAdmin, createTenant);
router.get('/', authenticateToken, authorizeRole('admin'), requireSuperAdmin, getAllTenants);
router.put('/:tenantId', authenticateToken, authorizeRole('admin'), requireSuperAdmin, updateTenant);
router.delete('/:tenantId', authenticateToken, authorizeRole('admin'), requireSuperAdmin, deleteTenant);
router.post('/:tenantId/reset-password', authenticateToken, authorizeRole('admin'), requireSuperAdmin, resetTenantAdminPassword);

// Biometric Devices Management for Super Admin
router.get('/biometric-devices/all', authenticateToken, authorizeRole('admin'), requireSuperAdmin, getBiometricDevices);
router.post('/biometric-devices/register', authenticateToken, authorizeRole('admin'), requireSuperAdmin, registerBiometricDevice);
router.delete('/biometric-devices/:serialNumber', authenticateToken, authorizeRole('admin'), requireSuperAdmin, deleteBiometricDevice);

module.exports = router;
