const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');

const getAllTemplates = asyncHandler(async (req, res) => {
  const { is_active } = req.query;
  let sql = 'SELECT * FROM payslip_templates WHERE 1=1';
  const params = [];
  if (is_active !== undefined) {
    sql += ' AND is_active = $1';
    params.push(is_active === 'true');
  }
  sql += ' ORDER BY is_default DESC, created_at DESC';
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
});

const getTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM payslip_templates WHERE template_id = $1', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Payslip template not found');
  res.json({ success: true, data: result.rows[0] });
});

const createTemplate = asyncHandler(async (req, res) => {
  const { name, description, layout_json, is_default } = req.body;
  if (!name) throw new ValidationError('Template name is required');

  if (is_default) {
    await query('UPDATE payslip_templates SET is_default = FALSE WHERE is_default = TRUE');
  }

  const result = await query(
    `INSERT INTO payslip_templates (name, description, layout_json, is_default, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description || '', JSON.stringify(layout_json || {}), is_default || false, req.user.userId]
  );
  res.status(201).json({ success: true, message: 'Template created', data: result.rows[0] });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, layout_json, is_active } = req.body;

  const existing = await query('SELECT * FROM payslip_templates WHERE template_id = $1', [id]);
  if (existing.rows.length === 0) throw new NotFoundError('Payslip template not found');

  await query(
    `UPDATE payslip_templates SET name = COALESCE($1, name), description = COALESCE($2, description),
     layout_json = COALESCE($3, layout_json), is_active = COALESCE($4, is_active),
     updated_at = CURRENT_TIMESTAMP WHERE template_id = $5`,
    [name || null, description !== undefined ? description : null,
     layout_json ? JSON.stringify(layout_json) : null,
     is_active !== undefined ? is_active : null, id]
  );

  const updated = await query('SELECT * FROM payslip_templates WHERE template_id = $1', [id]);
  res.json({ success: true, message: 'Template updated', data: updated.rows[0] });
});

const setDefaultTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query('SELECT * FROM payslip_templates WHERE template_id = $1', [id]);
  if (existing.rows.length === 0) throw new NotFoundError('Payslip template not found');

  await query('UPDATE payslip_templates SET is_default = FALSE WHERE is_default = TRUE');
  await query('UPDATE payslip_templates SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP WHERE template_id = $1', [id]);

  res.json({ success: true, message: 'Default template updated' });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('DELETE FROM payslip_templates WHERE template_id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Payslip template not found');
  res.json({ success: true, message: 'Template deleted' });
});

const previewTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employee_id } = req.query;

  const templateResult = await query('SELECT * FROM payslip_templates WHERE template_id = $1', [id]);
  if (templateResult.rows.length === 0) throw new NotFoundError('Template not found');
  const template = templateResult.rows[0];

  const empResult = employee_id
    ? await query('SELECT employee_id FROM employees WHERE employee_id = $1', [employee_id])
    : await query('SELECT employee_id FROM employees LIMIT 1');
  if (empResult.rows.length === 0) throw new NotFoundError('No employees available for preview');

  const empId = empResult.rows[0].employee_id;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const payslipEngine = require('../services/payslipEngine');
  const pdfService = require('../services/pdfService');

  const payslipData = await payslipEngine.generatePayslipData(empId, month, year);

  const keys = ['company_name', 'company_address', 'company_email', 'company_phone', 'company_logo_url', 'currency_symbol'];
  const companySettings = {};
  for (const key of keys) {
    const r = await query('SELECT setting_value FROM settings WHERE setting_key = $1', [key]);
    companySettings[key] = r.rows[0]?.setting_value || '';
  }

  const empRecord = await query('SELECT employee_code, pan, bank_account, uan, esic FROM employees WHERE employee_id = $1', [empId]);
  const emp = empRecord.rows[0] || {};

  const pdfOptions = {
    template,
    companyName: companySettings.company_name,
    companyAddress: companySettings.company_address,
    companyEmail: companySettings.company_email,
    companyPhone: companySettings.company_phone,
    companyLogoUrl: companySettings.company_logo_url,
    currencySymbol: companySettings.currency_symbol || '$',
    employeeCode: emp.employee_code,
    pan: emp.pan,
    bankAccount: emp.bank_account,
    uan: emp.uan,
    esic: emp.esic,
  };

  const pdfPath = await pdfService.generatePayslipPDF(payslipData, pdfOptions);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=preview.pdf');
  res.sendFile(pdfPath);
});

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  setDefaultTemplate,
  deleteTemplate,
  previewTemplate,
};
