const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);

// Get logs (Admin only)
router.get('/', authorizeRole('admin'), auditController.getLogs);

module.exports = router;
