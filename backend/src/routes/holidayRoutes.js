const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const holidayController = require('../controllers/holidayController');

const holidayValidation = [
    body('name').notEmpty().withMessage('Holiday name is required'),
    body('date').notEmpty().withMessage('Date is required'),
];

// All authenticated users can view holidays
router.get('/', authenticateToken, holidayController.getAllHolidays);
router.get('/my-restricted', authenticateToken, holidayController.getEmployeeRestrictedHolidays);
router.post('/opt-in', authenticateToken, holidayController.optInRestrictedHoliday);

// Admin CRUD
router.post('/', authenticateToken, authorizeRole('admin', 'manager'), holidayValidation, validate, holidayController.createHoliday);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager'), holidayController.updateHoliday);
router.delete('/:id', authenticateToken, authorizeRole('admin'), holidayController.deleteHoliday);

module.exports = router;
