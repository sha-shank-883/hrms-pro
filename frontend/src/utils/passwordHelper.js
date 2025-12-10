/**
 * Validates a password against the provided security settings.
 * 
 * @param {string} password - The password to validate
 * @param {object} settings - The settings object containing security configuration
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password, settings) => {
    if (!password) {
        return { isValid: false, errors: ['Password is required'] };
    }

    const minLength = parseInt(settings.password_min_length || 6);
    const requireUppercase = settings.password_require_uppercase === 'true' || settings.password_require_uppercase === true;
    const requireNumber = settings.password_require_number === 'true' || settings.password_require_number === true;

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
};
