const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');
const { logAction } = require('../middleware/auditLogger');

// Validation rules
const departmentValidation = [
  body('department_name').notEmpty().withMessage('Department name is required'),
  body('budget').optional().isDecimal().withMessage('Budget must be a valid number'),
];

// Routes
router.get('/', authenticateToken, departmentController.getAllDepartments);
router.get('/:id', authenticateToken, departmentController.getDepartmentById);
router.post('/', authenticateToken, authorizeRole('admin', 'manager'), departmentValidation, validate, logAction('CREATE_DEPARTMENT', 'DEPARTMENT'), departmentController.createDepartment);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager'), departmentValidation, validate, logAction('UPDATE_DEPARTMENT', 'DEPARTMENT'), departmentController.updateDepartment);
router.delete('/:id', authenticateToken, authorizeRole('admin'), logAction('DELETE_DEPARTMENT', 'DEPARTMENT'), departmentController.deleteDepartment);

module.exports = router;
