const { query } = require('../config/database');

/**
 * Validates a password against the security settings in the database.
 * 
 * @param {string} password - The password to validate
 * @returns {Promise<object>} - { isValid: boolean, errors: string[] }
 */
const validatePassword = async (password) => {
    if (!password) {
        return { isValid: false, errors: ['Password is required'] };
    }

    try {
        // Fetch password settings
        const result = await query("SELECT setting_key, setting_value FROM settings WHERE category = 'security'");
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        const minLength = parseInt(settings.password_min_length || 6);
        const requireUppercase = settings.password_require_uppercase === 'true';
        const requireNumber = settings.password_require_number === 'true';

        const errors = [];

        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long.`);
        }

        if (requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter.');
        }

        if (requireNumber && !/\d/.test(password)) {
            errors.push('Password must contain at least one number.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    } catch (error) {
        console.error('Password validation error:', error);
        // Fallback to basic validation if settings cannot be fetched
        if (password.length < 6) {
            return { isValid: false, errors: ['Password must be at least 6 characters long.'] };
        }
        return { isValid: true, errors: [] };
    }
};

module.exports = { validatePassword };
