const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

const router = express.Router();

// Validation rules
const taskValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date'),
  body('department_id').optional().isInt().withMessage('Invalid department ID'),
  body('estimated_hours').optional().isDecimal().withMessage('Invalid estimated hours'),
  body('category').optional().isIn(['general', 'onboarding', 'offboarding']).withMessage('Invalid category'),
];

// Routes
router.get('/', authenticateToken, taskController.getAllTasks);
router.get('/statistics', authenticateToken, taskController.getTaskStatistics);
router.get('/:id', authenticateToken, taskController.getTaskById);
router.post('/', authenticateToken, authorizeRole('admin', 'manager'), taskValidation, validate, taskController.createTask);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager'), taskValidation, validate, taskController.updateTask);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'manager'), taskController.deleteTask);

// Task updates routes
router.post('/:task_id/updates', authenticateToken, taskController.addTaskUpdate);
router.get('/:task_id/updates', authenticateToken, taskController.getTaskUpdates);
router.put('/updates/:update_id', authenticateToken, taskController.updateTaskUpdate);
router.delete('/updates/:update_id', authenticateToken, taskController.deleteTaskUpdate);

module.exports = router;