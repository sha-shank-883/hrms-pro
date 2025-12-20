const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const emailTemplateController = require('../controllers/emailTemplateController');

// Validation rules for creating/updating email templates
const templateValidation = [
    body('name').notEmpty().withMessage('Template name is required'),
    body('subject').notEmpty().withMessage('Email subject is required'),
    body('body_html').optional({ nullable: true }).isString(),
    body('body_text').optional({ nullable: true }).isString(),
    body('variables').optional({ nullable: true }).isObject()
];

// Routes for email template management (admin only)
router.get('/', authenticateToken, authorizeRole('admin'), emailTemplateController.getAllTemplates);
router.get('/:id', authenticateToken, authorizeRole('admin'), emailTemplateController.getTemplateById);
router.post('/', authenticateToken, authorizeRole('admin'), templateValidation, validate, emailTemplateController.createTemplate);
router.put('/:id', authenticateToken, authorizeRole('admin'), templateValidation, validate, emailTemplateController.updateTemplate);
router.delete('/:id', authenticateToken, authorizeRole('admin'), emailTemplateController.deleteTemplate);

// Route for sending templated emails (accessible to admins and managers)
router.post('/send', authenticateToken, authorizeRole('admin', 'manager'), emailTemplateController.sendTemplatedEmail);

module.exports = router;