const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

// Validation rules
const createEmployeeValidation = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department_id').optional().isInt().withMessage('Valid department ID is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('hire_date').isISO8601().withMessage('Valid hire date is required'),
  body('salary').optional().isDecimal().withMessage('Valid salary is required'),
];

const updateEmployeeValidation = [
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('department_id').optional().isInt().withMessage('Valid department ID is required'),
  body('hire_date').optional().isISO8601().withMessage('Valid hire date is required'),
  body('salary').optional().isDecimal().withMessage('Valid salary is required'),
];

// Routes
router.get('/', authenticateToken, authorizeRole('admin', 'manager'), employeeController.getAllEmployees);
// Special route for chat - bypasses RBAC to allow employees to see each other
router.get('/chat', authenticateToken, employeeController.getEmployeesForChat);
// Org Chart
router.get('/org-chart', authenticateToken, employeeController.getOrgChart);
router.get('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), employeeController.getEmployeeById);
router.get('/user/:userId', authenticateToken, authorizeRole('admin', 'manager', 'employee'), employeeController.getEmployeeByUserId);
router.get('/:id/qrcode', authenticateToken, authorizeRole('admin', 'manager', 'employee'), employeeController.getEmployeeQRCode);
router.post('/', authenticateToken, authorizeRole('admin'), createEmployeeValidation, validate, logAction('CREATE_EMPLOYEE', 'EMPLOYEE'), employeeController.createEmployee);
router.post('/delete-by-email', authenticateToken, authorizeRole('admin'), logAction('DELETE_EMPLOYEE_BY_EMAIL', 'EMPLOYEE'), employeeController.deleteEmployeeByEmail);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), updateEmployeeValidation, validate, logAction('UPDATE_EMPLOYEE', 'EMPLOYEE'), employeeController.updateEmployee);
router.patch('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), logAction('PATCH_EMPLOYEE', 'EMPLOYEE'), employeeController.patchEmployee);
router.delete('/:id', authenticateToken, authorizeRole('admin'), logAction('DELETE_EMPLOYEE', 'EMPLOYEE'), employeeController.deleteEmployee);

module.exports = router;