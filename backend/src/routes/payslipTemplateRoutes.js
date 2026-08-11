const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLogger');
const templateController = require('../controllers/payslipTemplateController');

const router = express.Router();

router.get('/', authenticateToken, authorizeRole('admin', 'manager'), templateController.getAllTemplates);
router.get('/:id', authenticateToken, authorizeRole('admin', 'manager', 'employee'), templateController.getTemplateById);
router.post('/', authenticateToken, authorizeRole('admin'),
  [body('name').notEmpty().withMessage('Template name is required')],
  validate, logAction('CREATE_PAYSLIP_TEMPLATE', 'PAYROLL'), templateController.createTemplate
);
router.put('/:id', authenticateToken, authorizeRole('admin'), logAction('UPDATE_PAYSLIP_TEMPLATE', 'PAYROLL'), templateController.updateTemplate);
router.put('/:id/set-default', authenticateToken, authorizeRole('admin'), logAction('SET_DEFAULT_TEMPLATE', 'PAYROLL'), templateController.setDefaultTemplate);
router.get('/:id/preview', authenticateToken, authorizeRole('admin', 'manager'), templateController.previewTemplate);
router.delete('/:id', authenticateToken, authorizeRole('admin'), logAction('DELETE_PAYSLIP_TEMPLATE', 'PAYROLL'), templateController.deleteTemplate);

module.exports = router;
