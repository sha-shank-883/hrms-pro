const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const runController = require('../controllers/payrollRunController');
const { logAction } = require('../middleware/auditLogger');
const checkModuleAccess = require('../middleware/checkModuleAccess');

const router = express.Router();
router.use(checkModuleAccess('payroll'));

router.get('/', authenticateToken, authorizeRole('admin', 'manager'), runController.getAllRuns);
router.get('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), runController.getRunById);
router.post('/', authenticateToken, authorizeRole('admin'),
  [body('period_month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
   body('period_year').isInt().withMessage('Valid year is required')],
  validate, logAction('CREATE_RUN', 'PAYROLL'), runController.createRun
);
router.put('/:id/finalize', authenticateToken, authorizeRole('admin'), logAction('FINALIZE_RUN', 'PAYROLL'), runController.finalizeRun);
router.put('/:id/pay', authenticateToken, authorizeRole('admin'), logAction('PAY_RUN', 'PAYROLL'), runController.payRun);
router.put('/:id/archive', authenticateToken, authorizeRole('admin'), logAction('ARCHIVE_RUN', 'PAYROLL'), runController.archiveRun);
router.delete('/:id', authenticateToken, authorizeRole('admin'), logAction('DELETE_RUN', 'PAYROLL'), runController.deleteRun);

module.exports = router;
