const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');
const { logAction } = require('../middleware/auditLogger');

// Validation rules
const attendanceValidation = [
  body('employee_id').isInt().withMessage('Valid employee ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('status').isIn(['present', 'absent', 'half-day', 'late']).withMessage('Invalid status'),
];

const clockValidation = [
  body('employee_id').isInt().withMessage('Valid employee ID is required'),
];

// Routes
router.get('/', authenticateToken, attendanceController.getAllAttendance);
router.post('/clock-in', authenticateToken, clockValidation, validate, logAction('CLOCK_IN', 'ATTENDANCE'), attendanceController.clockIn);
router.post('/clock-out', authenticateToken, clockValidation, validate, logAction('CLOCK_OUT', 'ATTENDANCE'), attendanceController.clockOut);
router.post('/', authenticateToken, authorizeRole('admin', 'manager'), attendanceValidation, validate, logAction('CREATE_ATTENDANCE', 'ATTENDANCE'), attendanceController.createAttendance);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager'), logAction('UPDATE_ATTENDANCE', 'ATTENDANCE'), attendanceController.updateAttendance);
router.delete('/:id', authenticateToken, authorizeRole('admin'), logAction('DELETE_ATTENDANCE', 'ATTENDANCE'), attendanceController.deleteAttendance);

module.exports = router;
