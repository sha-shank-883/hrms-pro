const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const payrollController = require('../controllers/payrollController');

const router = express.Router();

// Validation rules
const payrollValidation = [
  body('employee_id').isInt().withMessage('Valid employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt().withMessage('Valid year is required'),
  body('basic_salary').isDecimal().withMessage('Valid basic salary is required'),
];

// Routes
// Allow employees to access their own payroll data (filtered in controller)
router.get('/', authenticateToken, authorizeRole('admin', 'manager', 'employee'), payrollController.getAllPayroll);
router.get('/statistics', authenticateToken, authorizeRole('admin', 'manager', 'employee'), payrollController.getPayrollStatistics);
router.get('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), payrollController.getPayrollById);
router.post('/', authenticateToken, authorizeRole('admin', 'manager'), payrollValidation, validate, payrollController.createPayroll);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager'), payrollController.updatePayroll);
router.put('/:id/process', authenticateToken, authorizeRole('admin', 'manager'), payrollController.processPayment);
router.delete('/:id', authenticateToken, authorizeRole('admin'), payrollController.deletePayroll);

// Automatic payroll generation
router.post('/generate', authenticateToken, authorizeRole('admin', 'manager'), payrollController.generateAutomaticPayroll);
router.post('/generate-bulk', authenticateToken, authorizeRole('admin', 'manager'), payrollController.generateBulkPayroll);

module.exports = router;