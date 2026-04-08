const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);

// Shift profiles
router.get('/', shiftController.getShifts);
router.post('/', authorizeRole('admin', 'hr', 'manager'), shiftController.createShift);
router.put('/:id', authorizeRole('admin', 'hr', 'manager'), shiftController.updateShift);
router.delete('/:id', authorizeRole('admin', 'hr'), shiftController.deleteShift);

// Assignment logic
router.get('/assignments', shiftController.getAssignments);
router.post('/assign', authorizeRole('admin', 'hr', 'manager'), shiftController.assignShift);
router.delete('/assignments/:id', authorizeRole('admin', 'hr', 'manager'), shiftController.deleteAssignment);

module.exports = router;
