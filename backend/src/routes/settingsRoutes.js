const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// Validation rules
const settingValidation = [
  body('setting_key').notEmpty().withMessage('Setting key is required'),
  body('setting_value').notEmpty().withMessage('Setting value is required'),
];

// Routes
router.get('/', authenticateToken, settingsController.getAllSettings);
router.get('/:key', authenticateToken, settingsController.getSettingByKey);
router.post('/', authenticateToken, authorizeRole('admin'), settingValidation, validate, settingsController.createSetting);
router.put('/:key', authenticateToken, authorizeRole('admin'), settingsController.updateSetting);
router.put('/', authenticateToken, authorizeRole('admin'), settingsController.bulkUpdateSettings);
router.delete('/:key', authenticateToken, authorizeRole('admin'), settingsController.deleteSetting);

module.exports = router;
