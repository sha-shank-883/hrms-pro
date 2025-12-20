const emailTemplateModel = require('../models/emailTemplateModel');
const { sendEmail } = require('../services/emailService');
const { compileTemplate, validateVariables, formatDate, formatCurrency, formatNumber } = require('../services/templateService');

/**
 * Get all email templates
 * @route GET /api/email-templates
 */
const getAllTemplates = async (req, res) => {
    try {
        const templates = await emailTemplateModel.getAllTemplates();
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Get all templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email templates',
            error: error.message
        });
    }
};

/**
 * Get email template by ID
 * @route GET /api/email-templates/:id
 */
const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await emailTemplateModel.getTemplateById(id);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Email template not found'
            });
        }
        
        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Get template by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email template',
            error: error.message
        });
    }
};

/**
 * Create a new email template
 * @route POST /api/email-templates
 */
const createTemplate = async (req, res) => {
    try {
        const { name, subject, body_html, body_text, variables } = req.body;
        
        // Validate required fields
        if (!name || !subject || (!body_html && !body_text)) {
            return res.status(400).json({
                success: false,
                message: 'Name, subject, and at least one body format (HTML or text) are required'
            });
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
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create email template',
            error: error.message
        });
    }
};

/**
 * Update an email template
 * @route PUT /api/email-templates/:id
 */
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, body_html, body_text, variables } = req.body;
        
        // Check if template exists
        const existingTemplate = await emailTemplateModel.getTemplateById(id);
        if (!existingTemplate) {
            return res.status(404).json({
                success: false,
                message: 'Email template not found'
            });
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
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email template',
            error: error.message
        });
    }
};

/**
 * Delete an email template
 * @route DELETE /api/email-templates/:id
 */
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if template exists
        const existingTemplate = await emailTemplateModel.getTemplateById(id);
        if (!existingTemplate) {
            return res.status(404).json({
                success: false,
                message: 'Email template not found'
            });
        }
        
        const deleted = await emailTemplateModel.deleteTemplate(id);
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Email template deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete email template'
            });
        }
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete email template',
            error: error.message
        });
    }
};

/**
 * Send a templated email
 * @route POST /api/email-templates/send
 */
const sendTemplatedEmail = async (req, res) => {
    try {
        const { template_name, template_id, to, variables = {} } = req.body;
        
        // Validate required fields
        if (!to) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email address is required'
            });
        }
        
        if (!template_name && !template_id) {
            return res.status(400).json({
                success: false,
                message: 'Either template_name or template_id is required'
            });
        }
        
        // Get template
        let template;
        if (template_id) {
            template = await emailTemplateModel.getTemplateById(template_id);
        } else {
            template = await emailTemplateModel.getTemplateByName(template_name);
        }
        
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Email template not found'
            });
        }
        
        // Validate variables against template schema if defined
        if (template.variables && Object.keys(template.variables).length > 0) {
            const validation = validateVariables(variables, template.variables);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid template variables',
                    errors: validation.errors
                });
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
        
        const result = await sendEmail(emailOptions);
        
        res.json({
            success: true,
            message: 'Email sent successfully',
            data: {
                messageId: result.messageId
            }
        });
    } catch (error) {
        console.error('Send templated email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

module.exports = {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    sendTemplatedEmail
};