const { query } = require('../config/database');

/**
 * Get all email templates
 * @returns {Promise<Array>} Array of email templates
 */
const getAllTemplates = async () => {
    const result = await query('SELECT * FROM email_templates ORDER BY created_at DESC');
    return result.rows;
};

/**
 * Get email template by ID
 * @param {number} id - Template ID
 * @returns {Promise<Object|null>} Email template or null if not found
 */
const getTemplateById = async (id) => {
    const result = await query('SELECT * FROM email_templates WHERE id = $1', [id]);
    return result.rows[0] || null;
};

/**
 * Get email template by name
 * @param {string} name - Template name
 * @returns {Promise<Object|null>} Email template or null if not found
 */
const getTemplateByName = async (name) => {
    const result = await query('SELECT * FROM email_templates WHERE name = $1', [name]);
    return result.rows[0] || null;
};

/**
 * Create a new email template
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Template name
 * @param {string} templateData.subject - Email subject
 * @param {string} templateData.body_html - HTML body
 * @param {string} templateData.body_text - Text body
 * @param {Object} templateData.variables - Template variables (JSON)
 * @returns {Promise<Object>} Created template
 */
const createTemplate = async (templateData) => {
    const { name, subject, body_html, body_text, variables = {} } = templateData;
    
    const result = await query(
        `INSERT INTO email_templates (name, subject, body_html, body_text, variables)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, subject, body_html, body_text, JSON.stringify(variables)]
    );
    
    return result.rows[0];
};

/**
 * Update an email template
 * @param {number} id - Template ID
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Updated template
 */
const updateTemplate = async (id, templateData) => {
    const { name, subject, body_html, body_text, variables } = templateData;
    
    const result = await query(
        `UPDATE email_templates 
         SET name = $1, subject = $2, body_html = $3, body_text = $4, variables = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [name, subject, body_html, body_text, JSON.stringify(variables), id]
    );
    
    return result.rows[0];
};

/**
 * Delete an email template
 * @param {number} id - Template ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
const deleteTemplate = async (id) => {
    const result = await query('DELETE FROM email_templates WHERE id = $1', [id]);
    return result.rowCount > 0;
};

module.exports = {
    getAllTemplates,
    getTemplateById,
    getTemplateByName,
    createTemplate,
    updateTemplate,
    deleteTemplate
};