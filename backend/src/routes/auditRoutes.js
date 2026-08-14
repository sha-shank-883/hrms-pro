const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const checkModuleAccess = require('../middleware/checkModuleAccess');

router.use(authenticateToken);
router.use(checkModuleAccess('audit_logs'));

// Get logs (Admin only)
router.get('/', authorizeRole('admin'), auditController.getLogs);

module.exports = router;
