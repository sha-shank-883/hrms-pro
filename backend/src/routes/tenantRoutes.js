const express = require('express');
const router = express.Router();
const { 
  createTenant, getAllTenants, updateTenant, resetTenantAdminPassword, deleteTenant, 
  getBiometricDevices, registerBiometricDevice, deleteBiometricDevice, impersonateTenantAdmin, 
  backupTenant, restoreTenant,
  getPlanConfigs, updatePlanConfig, getTenantModules, updateTenantModules,
  getBillingOverview, getTenantBillingProfile, updateTenantBillingProfile, recordManualPayment,
  getMyTenantBilling, updateMyTenantBilling, getInvoiceDetails,
  getGrowthAnalytics,
  getActiveBroadcasts, getAllBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast,
  getPlatformAuditLogs,
  getSystemHealthDiagnostics,
  getBackupArchives, triggerAllTenantBackups, downloadBackupArchive
} = require('../controllers/tenantController');
const { authenticateToken, authorizeRole, requireSuperAdmin } = require('../middleware/auth');

// Active Broadcasts for Public/Tenant Header Banner
router.get('/active-broadcasts', authenticateToken, getActiveBroadcasts);

// Platform Broadcasts Management (Super Admin)
router.get('/broadcasts', authenticateToken, requireSuperAdmin, getAllBroadcasts);
router.post('/broadcasts', authenticateToken, requireSuperAdmin, createBroadcast);
router.put('/broadcasts/:id', authenticateToken, requireSuperAdmin, updateBroadcast);
router.delete('/broadcasts/:id', authenticateToken, requireSuperAdmin, deleteBroadcast);

// Platform Security & Cross-Tenant Audit Logs (Super Admin)
router.get('/platform-audit-logs', authenticateToken, requireSuperAdmin, getPlatformAuditLogs);

// Live System Health & Infrastructure Diagnostics (Super Admin)
router.get('/system-health', authenticateToken, requireSuperAdmin, getSystemHealthDiagnostics);

// Tenant Backup Archives & Automated Snapshots (Super Admin)
router.get('/backups/archives', authenticateToken, requireSuperAdmin, getBackupArchives);
router.post('/backups/trigger-all', authenticateToken, requireSuperAdmin, triggerAllTenantBackups);
router.get('/backups/archives/:id/download', authenticateToken, requireSuperAdmin, downloadBackupArchive);

// Platform Sales, Marketing & Growth Analytics (Super Admin)
router.get('/growth-analytics', authenticateToken, requireSuperAdmin, getGrowthAnalytics);

// Tenant Self-Serve Customer Billing & Invoices
router.get('/my-billing', authenticateToken, getMyTenantBilling);
router.put('/my-billing', authenticateToken, updateMyTenantBilling);
router.get('/invoice/:invoiceId', authenticateToken, getInvoiceDetails);

// Platform Billing & Customer Revenue Management (Super Admin)
router.get('/billing/overview', authenticateToken, requireSuperAdmin, getBillingOverview);
router.post('/billing/record-manual', authenticateToken, requireSuperAdmin, recordManualPayment);
router.get('/:tenantId/billing-profile', authenticateToken, requireSuperAdmin, getTenantBillingProfile);
router.put('/:tenantId/billing-profile', authenticateToken, requireSuperAdmin, updateTenantBillingProfile);

// Plan Configurations & System Modules Management
router.get('/plans/configs', authenticateToken, requireSuperAdmin, getPlanConfigs);
router.put('/plans/configs/:planId', authenticateToken, requireSuperAdmin, updatePlanConfig);

// Specific Tenant Module Entitlements & Overrides
router.get('/:tenantId/modules', authenticateToken, requireSuperAdmin, getTenantModules);
router.put('/:tenantId/modules', authenticateToken, requireSuperAdmin, updateTenantModules);

router.post('/', authenticateToken, authorizeRole('admin'), requireSuperAdmin, createTenant);
router.get('/', authenticateToken, authorizeRole('admin'), requireSuperAdmin, getAllTenants);
router.put('/:tenantId', authenticateToken, authorizeRole('admin'), requireSuperAdmin, updateTenant);
router.delete('/:tenantId', authenticateToken, authorizeRole('admin'), requireSuperAdmin, deleteTenant);
router.post('/:tenantId/reset-password', authenticateToken, authorizeRole('admin'), requireSuperAdmin, resetTenantAdminPassword);
router.post('/:tenantId/impersonate', authenticateToken, authorizeRole('admin'), requireSuperAdmin, impersonateTenantAdmin);
router.get('/:tenantId/backup', authenticateToken, authorizeRole('admin'), requireSuperAdmin, backupTenant);
router.post('/:tenantId/restore', authenticateToken, authorizeRole('admin'), requireSuperAdmin, express.json({ limit: '50mb' }), restoreTenant);

// Biometric Devices Management for Super Admin
router.get('/biometric-devices/all', authenticateToken, authorizeRole('admin'), requireSuperAdmin, getBiometricDevices);
router.post('/biometric-devices/register', authenticateToken, authorizeRole('admin'), requireSuperAdmin, registerBiometricDevice);
router.delete('/biometric-devices/:serialNumber', authenticateToken, authorizeRole('admin'), requireSuperAdmin, deleteBiometricDevice);

module.exports = router;

