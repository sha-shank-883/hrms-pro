const emailTemplateModel = require('../models/emailTemplateModel');
const { sendEmailSync } = require('../services/emailService');
const { compileTemplate, validateVariables, formatDate, formatCurrency, formatNumber } = require('../services/templateService');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

/**
 * Get all email templates
 * @route GET /api/email-templates
 */
const getAllTemplates = asyncHandler(async (req, res) => {
  const templates = await emailTemplateModel.getAllTemplates();
  res.json({
    success: true,
    data: templates
  });
});

/**
 * Get email template by ID
 * @route GET /api/email-templates/:id
 */
const getTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const template = await emailTemplateModel.getTemplateById(id);

  if (!template) {
    throw new NotFoundError('Email template not found');
  }

  res.json({
    success: true,
    data: template
  });
});

/**
 * Create a new email template
 * @route POST /api/email-templates
 */
const createTemplate = asyncHandler(async (req, res) => {
  const { name, subject, body_html, body_text, variables } = req.body;

  // Validate required fields
  if (!name || !subject || (!body_html && !body_text)) {
    throw new ValidationError('Name, subject, and at least one body format (HTML or text) are required');
  }

  const templateData = {
    name,
    subject,
    body_html: body_html || '',
    body_text: body_text || '',
    variables: variables || {}
  };

  const newTemplate = await emailTemplateModel.createTemplate(templateData);

  res.status(201).json({
    success: true,
    message: 'Email template created successfully',
    data: newTemplate
  });
});

/**
 * Update an email template
 * @route PUT /api/email-templates/:id
 */
const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, subject, body_html, body_text, variables } = req.body;

  // Check if template exists
  const existingTemplate = await emailTemplateModel.getTemplateById(id);
  if (!existingTemplate) {
    throw new NotFoundError('Email template not found');
  }

  const templateData = {
    name: name || existingTemplate.name,
    subject: subject || existingTemplate.subject,
    body_html: body_html !== undefined ? body_html : existingTemplate.body_html,
    body_text: body_text !== undefined ? body_text : existingTemplate.body_text,
    variables: variables || existingTemplate.variables
  };

  const updatedTemplate = await emailTemplateModel.updateTemplate(id, templateData);

  res.json({
    success: true,
    message: 'Email template updated successfully',
    data: updatedTemplate
  });
});

/**
 * Delete an email template
 * @route DELETE /api/email-templates/:id
 */
const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if template exists
  const existingTemplate = await emailTemplateModel.getTemplateById(id);
  if (!existingTemplate) {
    throw new NotFoundError('Email template not found');
  }

  const deleted = await emailTemplateModel.deleteTemplate(id);

  if (deleted) {
    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } else {
    throw new AppError('Failed to delete email template', 500);
  }
});

/**
 * Send a templated email
 * @route POST /api/email-templates/send
 */
const sendTemplatedEmail = asyncHandler(async (req, res) => {
  const { template_name, template_id, to, variables = {} } = req.body;

  // Validate required fields
  if (!to) {
    throw new ValidationError('Recipient email address is required');
  }

  if (!template_name && !template_id) {
    throw new ValidationError('Either template_name or template_id is required');
  }

  // Get template
  let template;
  if (template_id) {
    template = await emailTemplateModel.getTemplateById(template_id);
  } else {
    template = await emailTemplateModel.getTemplateByName(template_name);
  }

  if (!template) {
    throw new NotFoundError('Email template not found');
  }

  // Validate variables against template schema if defined
  if (template.variables && Object.keys(template.variables).length > 0) {
    const validation = validateVariables(variables, template.variables);
    if (!validation.isValid) {
      throw new ValidationError('Invalid template variables: ' + validation.errors.join(', '));
    }
    // Use validated variables
    Object.assign(variables, validation.validated);
  }

  // Add helper functions to variables for use in templates
  variables.formatDate = formatDate;
  variables.formatCurrency = formatCurrency;
  variables.formatNumber = formatNumber;

  // Compile template with variables
  const compiledSubject = compileTemplate(template.subject, variables);
  const compiledHtml = template.body_html ? compileTemplate(template.body_html, variables) : '';
  const compiledText = template.body_text ? compileTemplate(template.body_text, variables) : '';

  // Send email
  const emailOptions = {
    to,
    subject: compiledSubject,
    html: compiledHtml || undefined,
    text: compiledText || undefined
  };

  const result = await sendEmailSync(emailOptions);

  res.json({
    success: true,
    message: 'Email sent successfully',
    data: {
      messageId: result.messageId
    }
  });
});

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendTemplatedEmail
};
