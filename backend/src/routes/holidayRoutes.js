const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const holidayController = require('../controllers/holidayController');

// All authenticated users can view holidays
router.get('/', authenticateToken, holidayController.getAllHolidays);
router.get('/my-restricted', authenticateToken, holidayController.getEmployeeRestrictedHolidays);
router.post('/opt-in', authenticateToken, holidayController.optInRestrictedHoliday);

module.exports = router;
