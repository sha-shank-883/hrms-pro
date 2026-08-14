const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const payslipController = require('../controllers/payslipController');
const { logAction } = require('../middleware/auditLogger');
const checkModuleAccess = require('../middleware/checkModuleAccess');

const router = express.Router();
router.use(checkModuleAccess('payroll'));

router.get('/', authenticateToken, authorizeRole('admin', 'manager', 'employee'), payslipController.listPayslips);
router.get('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), payslipController.getPayslipDetail);
router.get('/:id/pdf', authenticateToken, authorizeRole('admin', 'manager', 'employee'), payslipController.downloadPayslipPDF);
router.get('/:id/verify', authenticateToken, authorizeRole('admin', 'manager', 'employee'), payslipController.verifyPayslip);

router.post('/generate', authenticateToken, authorizeRole('admin', 'manager'),
  [body('employee_id').isInt().withMessage('Employee ID is required'),
   body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
   body('year').isInt().withMessage('Valid year is required')],
  validate, logAction('GENERATE_PAYSLIP', 'PAYROLL'), payslipController.generatePayslip
);

router.post('/generate-bulk', authenticateToken, authorizeRole('admin', 'manager'),
  [body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
   body('year').isInt().withMessage('Valid year is required')],
  validate, logAction('GENERATE_BULK_PAYSLIPS', 'PAYROLL'), payslipController.generateBulkPayslips
);

router.post('/:id/email', authenticateToken, authorizeRole('admin', 'manager'),
  [body('recipient_email').optional().isEmail().withMessage('Valid email is required')],
  validate, logAction('EMAIL_PAYSLIP', 'PAYROLL'), payslipController.emailPayslip
);

module.exports = router;
