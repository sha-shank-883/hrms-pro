// Settings Helper Functions
// These functions help integrate settings throughout the application

/**
 * Format currency based on settings
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default from settings)
 * @param {string} symbol - Currency symbol (default from settings)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', symbol = '$') => {
  return `${symbol}${parseFloat(amount).toLocaleString()}`;
};

/**
 * Calculate tax based on settings
 * @param {number} grossAmount - The gross amount
 * @param {number} taxRate - Tax rate percentage (default from settings)
 * @returns {number} Calculated tax amount
 */
export const calculateTax = (grossAmount, taxRate = 20) => {
  return (parseFloat(grossAmount) * parseFloat(taxRate)) / 100;
};

/**
 * Calculate overtime pay
 * @param {number} hours - Overtime hours worked
 * @param {number} hourlyRate - Base hourly rate
 * @param {number} overtimeRate - Overtime multiplier (default from settings)
 * @returns {number} Overtime pay amount
 */
export const calculateOvertimePay = (hours, hourlyRate, overtimeRate = 1.5) => {
  return parseFloat(hours) * parseFloat(hourlyRate) * parseFloat(overtimeRate);
};

/**
 * Check if date is within working days based on settings
 * @param {Date} date - Date to check
 * @param {number} workingDays - Number of working days per week (default from settings)
 * @returns {boolean} True if within working days
 */
export const isWorkingDay = (date, workingDays = 5) => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (workingDays === 5) {
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  } else if (workingDays === 6) {
    return dayOfWeek >= 1 && dayOfWeek <= 6; // Monday to Saturday
  }
  return true; // 7 days
};

/**
 * Calculate net salary based on settings
 * @param {object} payrollData - Payroll calculation data
 * @param {object} settings - Settings object
 * @returns {object} Calculated payroll breakdown
 */
export const calculateNetSalary = (payrollData, settings = {}) => {
  const basicSalary = parseFloat(payrollData.basic_salary || 0);
  const allowances = parseFloat(payrollData.allowances || 0);
  const overtimePay = parseFloat(payrollData.overtime_pay || 0);
  const bonus = parseFloat(payrollData.bonus || 0);
  const deductions = parseFloat(payrollData.deductions || 0);
  
  // Calculate tax if enabled
  let tax = parseFloat(payrollData.tax || 0);
  if (settings.tax_enabled === 'true' && !payrollData.tax) {
    const grossSalary = basicSalary + allowances + overtimePay + bonus;
    const taxRate = parseFloat(settings.default_tax_rate || 20);
    tax = (grossSalary * taxRate) / 100;
  }
  
  const netSalary = basicSalary + allowances + overtimePay + bonus - deductions - tax;
  
  return {
    basicSalary,
    allowances,
    overtimePay,
    bonus,
    deductions,
    tax,
    grossSalary: basicSalary + allowances + overtimePay + bonus,
    netSalary: netSalary.toFixed(2)
  };
};

/**
 * Format date based on settings
 * @param {Date|string} date - Date to format
 * @param {string} format - Date format from settings (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'MM/DD/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
};

/**
 * Check if overtime is enabled and calculate
 * @param {number} workHours - Hours worked
 * @param {object} settings - Settings object
 * @returns {object} Overtime calculation result
 */
export const checkOvertime = (workHours, settings = {}) => {
  const standardHours = parseFloat(settings.working_hours || 8);
  const overtimeEnabled = settings.overtime_enabled === 'true';
  
  if (!overtimeEnabled || workHours <= standardHours) {
    return {
      isOvertime: false,
      overtimeHours: 0,
      regularHours: workHours
    };
  }
  
  return {
    isOvertime: true,
    overtimeHours: (workHours - standardHours).toFixed(2),
    regularHours: standardHours
  };
};

/**
 * Validate password based on security settings
 * @param {string} password - Password to validate
 * @param {object} settings - Settings object
 * @returns {object} Validation result
 */
export const validatePassword = (password, settings = {}) => {
  const minLength = parseInt(settings.password_min_length || 8);
  const requireUppercase = settings.password_require_uppercase === 'true';
  const requireNumber = settings.password_require_number === 'true';
  const requireSpecial = settings.password_require_special === 'true';
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
