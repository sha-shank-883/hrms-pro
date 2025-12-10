const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLogger');

router.use(authenticateToken);

// Get all assets (accessible by all authenticated users)
router.get('/', assetController.getAllAssets);

// Create asset (Admin/Manager only)
router.post('/', authorizeRole('admin', 'manager'), logAction('CREATE_ASSET', 'ASSET'), assetController.createAsset);

// Update asset (Admin/Manager only)
router.put('/:id', authorizeRole('admin', 'manager'), logAction('UPDATE_ASSET', 'ASSET'), assetController.updateAsset);

// Delete asset (Admin/Manager only)
router.delete('/:id', authorizeRole('admin', 'manager'), logAction('DELETE_ASSET', 'ASSET'), assetController.deleteAsset);

// Assign asset (Admin/Manager only)
router.post('/assign', authorizeRole('admin', 'manager'), logAction('ASSIGN_ASSET', 'ASSET'), assetController.assignAsset);

module.exports = router;
