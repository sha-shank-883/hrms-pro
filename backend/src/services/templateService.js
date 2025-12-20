/**
 * Simple template compiler that replaces {{variable}} placeholders with values
 * Supports nested object properties using dot notation (e.g., {{user.name}})
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {Object} variables - Object containing variable values
 * @returns {string} Compiled template with variables replaced
 */
const compileTemplate = (template, variables = {}) => {
    if (!template) return '';
    
    let compiled = template;
    
    // Replace all {{variable}} placeholders with actual values
    // Support both simple variables and nested object properties
    compiled = compiled.replace(/{{\s*([\w\.\[\]]+)\s*}}/g, (match, variableName) => {
        try {
            // Handle nested properties (e.g., user.name, employee.department.name)
            const keys = variableName.split('.');
            let value = variables;
            
            for (const key of keys) {
                // Handle array notation (e.g., user[0])
                const arrayMatch = key.match(/^([\w]+)\[(\d+)\]$/);
                if (arrayMatch) {
                    const arrayName = arrayMatch[1];
                    const index = parseInt(arrayMatch[2]);
                    value = value[arrayName] && value[arrayName][index];
                } else {
                    value = value && value[key];
                }
                
                if (value === undefined || value === null) {
                    return '';
                }
            }
            
            return value !== undefined && value !== null ? String(value) : '';
        } catch (error) {
            console.warn(`Failed to process template variable: ${variableName}`, error);
            return '';
        }
    });
    
    return compiled;
};

/**
 * Validate template variables against expected schema
 * @param {Object} variables - Variables to validate
 * @param {Object} schema - Expected variable schema
 * @returns {Object} Validation result
 */
const validateVariables = (variables, schema) => {
    const errors = [];
    const validated = {};
    
    for (const [key, definition] of Object.entries(schema)) {
        const value = variables[key];
        
        // Check if required
        if (definition.required && (value === undefined || value === null)) {
            errors.push(`Missing required variable: ${key}`);
            continue;
        }
        
        // Skip validation for optional variables that are not provided
        if (value === undefined || value === null) {
            validated[key] = definition.default !== undefined ? definition.default : '';
            continue;
        }
        
        // Type checking
        if (definition.type) {
            if (definition.type === 'string' && typeof value !== 'string') {
                errors.push(`Variable ${key} should be a string`);
                continue;
            }
            
            if (definition.type === 'number' && typeof value !== 'number') {
                errors.push(`Variable ${key} should be a number`);
                continue;
            }
            
            if (definition.type === 'boolean' && typeof value !== 'boolean') {
                errors.push(`Variable ${key} should be a boolean`);
                continue;
            }
            
            if (definition.type === 'array' && !Array.isArray(value)) {
                errors.push(`Variable ${key} should be an array`);
                continue;
            }
            
            if (definition.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
                errors.push(`Variable ${key} should be an object`);
                continue;
            }
        }
        
        // Custom validation function
        if (definition.validate && typeof definition.validate === 'function') {
            const validationResult = definition.validate(value);
            if (validationResult !== true) {
                errors.push(`Variable ${key}: ${validationResult}`);
                continue;
            }
        }
        
        validated[key] = value;
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        validated
    };
};

/**
 * Format a date according to specified format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY')
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    const formats = {
        'YYYY-MM-DD': `${year}-${month}-${day}`,
        'MM/DD/YYYY': `${month}/${day}/${year}`,
        'DD/MM/YYYY': `${day}/${month}/${year}`,
        'YYYY/MM/DD': `${year}/${month}/${day}`
    };
    
    return formats[format] || formats['YYYY-MM-DD'];
};

/**
 * Format a currency value
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (amount === undefined || amount === null) return '';
    
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(num);
};

/**
 * Format a number with specified decimals
 * @param {number|string} number - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
const formatNumber = (number, decimals = 2) => {
    if (number === undefined || number === null) return '';
    
    const num = parseFloat(number);
    if (isNaN(num)) return '';
    
    return num.toFixed(decimals);
};

module.exports = {
    compileTemplate,
    validateVariables,
    formatDate,
    formatCurrency,
    formatNumber
};