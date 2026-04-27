const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticateToken: protect, authorizeRole: authorize } = require('../middleware/auth');

// Public route for demo sign up
router.post('/demo', leadController.applyForDemo);

// Protected Admin Route to view all leads
// Only accessible by superadmin or admin on the default tenant (if applicable)
router.get('/', protect, authorize('admin', 'superadmin'), leadController.getAllLeads);

// Protected route to provision a pending demo request
router.post('/provision/:id', protect, authorize('admin', 'superadmin'), leadController.provisionDemo);

// Protected route to download a full JSON backup of a demo account
router.get('/:id/backup', protect, authorize('admin', 'superadmin'), leadController.backupDemoAccount);

// Protected route to fully delete a demo account and its schema
router.delete('/:id', protect, authorize('admin', 'superadmin'), leadController.deleteDemoAccount);

// Protected route to restore a demo account from a backup JSON
router.post('/restore', protect, authorize('admin', 'superadmin'), express.json({ limit: '50mb' }), leadController.restoreDemoAccount);

module.exports = router;
