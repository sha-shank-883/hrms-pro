const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const exportController = require('../controllers/exportController');

const router = express.Router();

router.get('/payslips', authenticateToken, authorizeRole('admin', 'manager'), exportController.exportPayslips);
router.get('/runs', authenticateToken, authorizeRole('admin', 'manager'), exportController.exportRuns);
router.get('/earnings', authenticateToken, authorizeRole('admin', 'manager'), exportController.exportEarnings);

module.exports = router;
