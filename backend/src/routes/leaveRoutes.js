const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const leaveController = require('../controllers/leaveController');
const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

// Validation rules
const leaveValidation = [
  body('employee_id').isInt().withMessage('Valid employee ID is required'),
  body('leave_type').notEmpty().withMessage('Leave type is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

// Leave balance routes (must be defined BEFORE :id routes)
router.get('/balance/:employee_id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), leaveController.getLeaveBalance);
router.get('/balance', authenticateToken, authorizeRole('admin', 'manager'), leaveController.getAllLeaveBalances);

// Comp-off routes (must be before :id routes)
router.post('/comp-off', authenticateToken, leaveController.requestCompOff);
router.put('/comp-off/:id', authenticateToken, authorizeRole('admin', 'manager'), leaveController.updateCompOffStatus);
router.get('/comp-off', authenticateToken, leaveController.getCompOffRequests);

// Routes
router.get('/', authenticateToken, authorizeRole('admin', 'manager', 'employee'), leaveController.getAllLeaveRequests);
router.get('/statistics', authenticateToken, authorizeRole('admin', 'manager', 'employee'), leaveController.getLeaveStatistics);
router.get('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), leaveController.getLeaveRequestById);
router.post('/', authenticateToken, authorizeRole('admin', 'manager', 'employee'), leaveValidation, validate, logAction('CREATE_LEAVE_REQUEST', 'LEAVE_REQUEST'), leaveController.createLeaveRequest);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), leaveValidation, validate, logAction('UPDATE_LEAVE_REQUEST', 'LEAVE_REQUEST'), leaveController.updateLeaveRequest);
router.put('/:id/approve', authenticateToken, authorizeRole('admin', 'manager'), logAction('APPROVE_LEAVE_REQUEST', 'LEAVE_REQUEST'), leaveController.approveLeaveRequest);
router.put('/:id/reject', authenticateToken, authorizeRole('admin', 'manager'), logAction('REJECT_LEAVE_REQUEST', 'LEAVE_REQUEST'), leaveController.rejectLeaveRequest);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), logAction('DELETE_LEAVE_REQUEST', 'LEAVE_REQUEST'), leaveController.deleteLeaveRequest);

module.exports = router;