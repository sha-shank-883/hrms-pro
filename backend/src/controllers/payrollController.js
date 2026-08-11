const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

// Helper function to get setting value
const getSetting = async (key, defaultValue = null) => {
  try {
    const result = await query('SELECT setting_value FROM settings WHERE setting_key = $1', [key]);
    return result.rows.length > 0 ? result.rows[0].setting_value : defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
};

// Get all payroll records with pagination
const getAllPayroll = asyncHandler(async (req, res) => {
  const { employee_id, month, year, payment_status, page = 1, limit = 10 } = req.query;
  const userRole = req.user.role;
  const userId = req.user.userId;

  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
  const offset = (pageNum - 1) * limitNum;

  let queryText = `
    SELECT p.*, 
           e.first_name || ' ' || e.last_name as employee_name,
           e.position,
           d.department_name
    FROM payroll p
    JOIN employees e ON p.employee_id = e.employee_id
    LEFT JOIN departments d ON e.department_id = d.department_id
    WHERE 1=1
  `;
  let countQueryText = `
    SELECT COUNT(*) as total
    FROM payroll p
    JOIN employees e ON p.employee_id = e.employee_id
    LEFT JOIN departments d ON e.department_id = d.department_id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  // Role-based filtering: employees can only see their own payroll
  if (userRole === 'employee') {
    queryText += ` AND e.user_id = $${paramCount}`;
    countQueryText += ` AND e.user_id = $${paramCount}`;
    params.push(userId);
    paramCount++;
  }

  if (employee_id) {
    queryText += ` AND p.employee_id = $${paramCount}`;
    countQueryText += ` AND p.employee_id = $${paramCount}`;
    params.push(employee_id);
    paramCount++;
  }

  if (month) {
    queryText += ` AND p.month = $${paramCount}`;
    countQueryText += ` AND p.month = $${paramCount}`;
    params.push(month);
    paramCount++;
  }

  if (year) {
    queryText += ` AND p.year = $${paramCount}`;
    countQueryText += ` AND p.year = $${paramCount}`;
    params.push(year);
    paramCount++;
  }

  if (payment_status) {
    queryText += ` AND p.payment_status = $${paramCount}`;
    countQueryText += ` AND p.payment_status = $${paramCount}`;
    params.push(payment_status);
    paramCount++;
  }

  queryText += ' ORDER BY p.year DESC, p.month DESC, p.created_at DESC';

  // Add pagination to main query
  queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  const paginatedParams = [...params, limitNum, offset];

  // Get total count
  const countResult = await query(countQueryText, params);
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limitNum);

  // Get paginated results
  const result = await query(queryText, paginatedParams);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      currentPage: pageNum,
      totalPages: totalPages,
      totalItems: total,
      itemsPerPage: limitNum,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  });
});

// Get single payroll record
const getPayrollById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userId = req.user.userId;

  let queryText = `
    SELECT p.*, 
            e.first_name || ' ' || e.last_name as employee_name,
            e.position,
            d.department_name
     FROM payroll p
     JOIN employees e ON p.employee_id = e.employee_id
     LEFT JOIN departments d ON e.department_id = d.department_id
     WHERE p.payroll_id = $1`;

  const params = [id];

  // Role-based filtering: employees can only see their own payroll
  if (userRole === 'employee') {
    queryText += ` AND e.user_id = $2`;
    params.push(userId);
  }

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Payroll record not found or access denied');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

// Get payroll statistics
const getPayrollStatistics = asyncHandler(async (req, res) => {
  const { employee_id, month, year, payment_status } = req.query;
  const userRole = req.user.role;
  const userId = req.user.userId;

  let queryText = `
    SELECT 
      COUNT(*) as total_records,
      COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pending_records,
      COUNT(CASE WHEN p.payment_status = 'paid' THEN 1 END) as paid_records,
      COUNT(CASE WHEN p.payment_status = 'cancelled' THEN 1 END) as cancelled_records,
      COALESCE(SUM(CASE WHEN p.payment_status = 'pending' THEN p.net_salary ELSE 0 END), 0) as total_pending_amount,
      COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.net_salary ELSE 0 END), 0) as total_paid_amount,
      COALESCE(SUM(CASE WHEN p.payment_status = 'cancelled' THEN p.net_salary ELSE 0 END), 0) as total_cancelled_amount,
      COALESCE(SUM(p.net_salary), 0) as total_amount
    FROM payroll p
    JOIN employees e ON p.employee_id = e.employee_id
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 1;

  // Role-based filtering: employees can only see their own payroll
  if (userRole === 'employee') {
    queryText += ` AND e.user_id = $${paramCount}`;
    params.push(userId);
    paramCount++;
  }

  if (employee_id) {
    queryText += ` AND p.employee_id = $${paramCount}`;
    params.push(employee_id);
    paramCount++;
  }

  if (month) {
    queryText += ` AND p.month = $${paramCount}`;
    params.push(month);
    paramCount++;
  }

  if (year) {
    queryText += ` AND p.year = $${paramCount}`;
    params.push(year);
    paramCount++;
  }

  if (payment_status) {
    queryText += ` AND p.payment_status = $${paramCount}`;
    params.push(payment_status);
    paramCount++;
  }

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows[0],
  });
});

// Create payroll record
const createPayroll = asyncHandler(async (req, res) => {
  const {
    employee_id, month, year, basic_salary, allowances,
    deductions, overtime_pay, bonus, tax, payment_method, notes
  } = req.body;

  // Get settings for auto-calculation
  const taxEnabled = await getSetting('tax_enabled', 'false');
  const defaultTaxRate = parseFloat(await getSetting('default_tax_rate', '20'));

  // Calculate tax if enabled and not provided
  let calculatedTax = parseFloat(tax || 0);
  if (taxEnabled === 'true' && !tax) {
    const grossSalary = parseFloat(basic_salary || 0) + parseFloat(allowances || 0) + parseFloat(overtime_pay || 0) + parseFloat(bonus || 0);
    calculatedTax = (grossSalary * defaultTaxRate) / 100;
  }

  // Calculate net salary
  const netSalary = parseFloat(basic_salary || 0)
    + parseFloat(allowances || 0)
    + parseFloat(overtime_pay || 0)
    + parseFloat(bonus || 0)
    - parseFloat(deductions || 0)
    - calculatedTax;

  const result = await query(
    `INSERT INTO payroll (
      employee_id, month, year, basic_salary, allowances, deductions,
      overtime_pay, bonus, tax, net_salary, payment_method, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      employee_id, month, year, basic_salary, allowances || 0, deductions || 0,
      overtime_pay || 0, bonus || 0, calculatedTax, netSalary, payment_method || null, notes || null
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Payroll record created successfully',
    data: result.rows[0],
  });
});

// Update payroll record
const updatePayroll = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      month, year, basic_salary, allowances, deductions, overtime_pay,
      bonus, tax, payment_status, payment_date, payment_method, notes
    } = req.body;

    // Validate required fields
    if (!month || !year || !basic_salary) {
      throw new ValidationError('Month, year, and basic salary are required');
    }

    // Calculate net salary
    const netSalary = parseFloat(basic_salary || 0)
      + parseFloat(allowances || 0)
      + parseFloat(overtime_pay || 0)
      + parseFloat(bonus || 0)
      - parseFloat(deductions || 0)
      - parseFloat(tax || 0);

    const result = await query(
      `UPDATE payroll 
       SET month = $1, year = $2, basic_salary = $3, allowances = $4, deductions = $5, overtime_pay = $6,
           bonus = $7, tax = $8, net_salary = $9, payment_status = $10,
           payment_date = $11, payment_method = $12, notes = $13, updated_at = CURRENT_TIMESTAMP
       WHERE payroll_id = $14
       RETURNING *`,
      [
        month, year, basic_salary, allowances || 0, deductions || 0, overtime_pay || 0,
        bonus || 0, tax || 0, netSalary, payment_status || 'pending',
        payment_date || null, payment_method || null, notes || null, id
      ]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payroll record not found');
    }

    res.json({
      success: true,
      message: 'Payroll record updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    // Handle specific DB constraint errors
    if (error.code === '23505') {
      throw new ConflictError('A payroll record already exists for this employee and period');
    } else if (error.code === '23503') {
      throw new ValidationError('Invalid employee ID');
    } else if (error.code === '22P02') {
      throw new ValidationError('Invalid data format provided');
    }
    throw error;
  }
});

// Delete payroll record
const deletePayroll = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM payroll WHERE payroll_id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Payroll record not found');
  }

  res.json({
    success: true,
    message: 'Payroll record deleted successfully',
  });
});

// Process payment (mark as paid)
const processPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;

  const result = await query(
    `UPDATE payroll 
     SET payment_status = 'paid', payment_date = CURRENT_DATE, payment_method = $1, updated_at = CURRENT_TIMESTAMP
     WHERE payroll_id = $2
     RETURNING *`,
    [payment_method, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Payroll record not found');
  }

  res.json({
    success: true,
    message: 'Payment processed successfully',
    data: result.rows[0],
  });
});

// Generate automatic payroll for an employee
const generateAutomaticPayroll = asyncHandler(async (req, res) => {
  const { employee_id, month, year } = req.body;

  // Validate required fields
  if (!employee_id || !month || !year) {
    throw new ValidationError('Employee ID, month, and year are required');
  }

  // Check if payroll already exists for this employee/month/year
  const existingPayroll = await query(
    'SELECT * FROM payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
    [employee_id, month, year]
  );

  if (existingPayroll.rows.length > 0) {
    throw new ConflictError('Payroll record already exists for this employee and period');
  }

  // Get employee details including base salary
  const employeeResult = await query(
    `SELECT e.*, d.department_name 
     FROM employees e 
     LEFT JOIN departments d ON e.department_id = d.department_id 
     WHERE e.employee_id = $1`,
    [employee_id]
  );

  if (employeeResult.rows.length === 0) {
    throw new NotFoundError('Employee not found');
  }

  const employee = employeeResult.rows[0];
  const baseSalary = parseFloat(employee.salary || 0);

  // Get attendance data for the month
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of the month

  const attendanceResult = await query(
    `SELECT * FROM attendance 
     WHERE employee_id = $1 AND date >= $2 AND date <= $3`,
    [employee_id, startDate, endDate]
  );

  // Get leave data for the month
  const leaveResult = await query(
    `SELECT * FROM leave_requests 
     WHERE employee_id = $1 AND status = 'approved' 
     AND ((start_date <= $2 AND end_date >= $3) OR 
          (start_date >= $3 AND start_date <= $2))`,
    [employee_id, endDate, startDate]
  );

  // Calculate attendance-based deductions
  let totalWorkingDays = 0;
  let presentDays = 0;
  let lateArrivals = 0;
  let earlyDepartures = 0;
  let totalWorkHours = 0;

  // Get attendance settings
  const workingHours = parseFloat(await getSetting('working_hours', '8'));
  const lateArrivalThreshold = parseInt(await getSetting('late_arrival_threshold', '15'));
  const earlyDepartureThreshold = parseInt(await getSetting('early_departure_threshold', '15'));
  const workingDaysPerWeek = parseInt(await getSetting('working_days', '5'));

  // Calculate working days in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  totalWorkingDays = Math.floor((daysInMonth * workingDaysPerWeek) / 7);

  // Process attendance records
  attendanceResult.rows.forEach(record => {
    if (record.status === 'present') {
      presentDays++;
      totalWorkHours += parseFloat(record.work_hours || 0);

      // Check for late arrivals and early departures
      if (record.clock_in) {
        // Calculate expected start time (assuming 9:00 AM as standard start time)
        const expectedStart = new Date(`${record.date}T09:00:00`);
        const actualStart = new Date(`${record.date}T${record.clock_in}`);
        const minutesLate = (actualStart - expectedStart) / (1000 * 60);

        if (minutesLate > lateArrivalThreshold) {
          lateArrivals++;
        }
      }

      if (record.clock_out) {
        // Calculate expected end time (assuming 5:00 PM as standard end time minus break)
        const expectedEnd = new Date(`${record.date}T17:00:00`);
        const actualEnd = new Date(`${record.date}T${record.clock_out}`);
        const minutesEarly = (expectedEnd - actualEnd) / (1000 * 60);

        if (minutesEarly > earlyDepartureThreshold) {
          earlyDepartures++;
        }
      }
    }
  });

  // Calculate leave days
  let totalLeaveDays = 0;
  leaveResult.rows.forEach(leave => {
    // Calculate overlapping days within the month
    const leaveStart = new Date(leave.start_date);
    const leaveEnd = new Date(leave.end_date);
    const monthStart = new Date(startDate);
    const monthEnd = new Date(endDate);

    const overlapStart = leaveStart > monthStart ? leaveStart : monthStart;
    const overlapEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd;

    if (overlapStart <= overlapEnd) {
      const timeDiff = overlapEnd.getTime() - overlapStart.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      totalLeaveDays += daysDiff;
    }
  });

  // Calculate deductions
  let attendanceDeduction = 0;
  let lateArrivalDeduction = 0;
  let earlyDepartureDeduction = 0;

  // Deduct for absent days
  const absentDays = totalWorkingDays - presentDays - totalLeaveDays;
  if (absentDays > 0) {
    const dailyRate = baseSalary / totalWorkingDays;
    attendanceDeduction = absentDays * dailyRate;
  }

  // Deduct for late arrivals (e.g., 1% of daily rate per late arrival)
  if (lateArrivals > 0) {
    const dailyRate = baseSalary / totalWorkingDays;
    lateArrivalDeduction = lateArrivals * (dailyRate * 0.01);
  }

  // Deduct for early departures (e.g., 1% of daily rate per early departure)
  if (earlyDepartures > 0) {
    const dailyRate = baseSalary / totalWorkingDays;
    earlyDepartureDeduction = earlyDepartures * (dailyRate * 0.01);
  }

  // Calculate social security and medicare deductions based on settings
  const socialSecurityRate = parseFloat(await getSetting('social_security_rate', '0'));
  const medicareRate = parseFloat(await getSetting('medicare_rate', '0'));
  const grossEarnings = baseSalary + overtimePay;
  const socialSecurityDeduction = (grossEarnings * socialSecurityRate) / 100;
  const medicareDeduction = (grossEarnings * medicareRate) / 100;

  // Calculate overtime
  const expectedWorkHours = presentDays * workingHours;
  const overtimeHours = Math.max(0, totalWorkHours - expectedWorkHours);
  const overtimeRate = parseFloat(await getSetting('overtime_rate', '1.5'));
  const hourlyRate = baseSalary / (totalWorkingDays * workingHours);
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;

  // Calculate allowances (from settings or employee-specific)
  const allowances = parseFloat(await getSetting('default_allowances', '0'));

  // Calculate tax
  const taxEnabled = await getSetting('tax_enabled', 'false');
  let taxAmount = 0;
  if (taxEnabled === 'true') {
    const taxRate = parseFloat(await getSetting('default_tax_rate', '20'));
    const taxableSalary = baseSalary + allowances + overtimePay -
      (attendanceDeduction + lateArrivalDeduction + earlyDepartureDeduction);
    taxAmount = (taxableSalary * taxRate) / 100;
  }

  // Calculate final salary components
  const totalDeductions = attendanceDeduction + lateArrivalDeduction +
    earlyDepartureDeduction + socialSecurityDeduction + medicareDeduction + taxAmount;
  const netSalary = baseSalary + allowances + overtimePay - totalDeductions;

  // Create payroll record
  const result = await query(
    `INSERT INTO payroll (
      employee_id, month, year, basic_salary, allowances, deductions,
      overtime_pay, bonus, tax, net_salary, payment_method, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      employee_id, month, year, baseSalary, allowances, totalDeductions,
      overtimePay, 0, taxAmount, netSalary, 'bank_transfer',
      `Auto-generated. Present: ${presentDays}, Absent: ${absentDays}, Leave: ${totalLeaveDays}, OT: ${overtimeHours.toFixed(2)}h, SS: ${socialSecurityDeduction.toFixed(2)}, MC: ${medicareDeduction.toFixed(2)}`
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Payroll generated successfully',
    data: {
      payroll: result.rows[0],
      attendance: {
        totalWorkingDays,
        presentDays,
        absentDays,
        lateArrivals,
        earlyDepartures,
        totalWorkHours,
        overtimeHours
      },
      leaves: {
        totalLeaveDays
      }
    }
  });
});

// Generate payroll for all employees in a month
const generateBulkPayroll = asyncHandler(async (req, res) => {
  const { month, year } = req.body;

  // Validate required fields
  if (!month || !year) {
    throw new ValidationError('Month and year are required');
  }

  // Get all employees
  const employeesResult = await query(
    'SELECT employee_id, salary FROM employees'
  );

  if (employeesResult.rows.length === 0) {
    throw new NotFoundError('No employees found');
  }

  const results = [];
  const errors = [];

  // Generate payroll for each employee
  for (const employee of employeesResult.rows) {
    try {
      // Check if payroll already exists
      const existingPayroll = await query(
        'SELECT * FROM payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
        [employee.employee_id, month, year]
      );

      if (existingPayroll.rows.length > 0) {
        results.push({
          employee_id: employee.employee_id,
          status: 'skipped',
          message: 'Payroll already exists'
        });
        continue;
      }

      // Generate payroll for this employee
      const reqBody = {
        body: {
          employee_id: employee.employee_id,
          month,
          year
        }
      };

      const resBody = {
        status: (code) => {
          return {
            json: (data) => {
              if (code >= 400) {
                errors.push({
                  employee_id: employee.employee_id,
                  error: data.message
                });
              } else {
                results.push({
                  employee_id: employee.employee_id,
                  status: 'success',
                  data: data.data
                });
              }
            }
          };
        }
      };

      // Call the generateAutomaticPayroll function directly
      await generateAutomaticPayroll(reqBody, resBody);
    } catch (error) {
      errors.push({
        employee_id: employee.employee_id,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    message: `Bulk payroll generation completed. ${results.filter(r => r.status === 'success').length} successful, ${errors.length} errors.`,
    data: {
      results,
      errors
    }
  });
});

// Submit Tax Declaration
const submitTaxDeclaration = asyncHandler(async (req, res) => {
  const {
    employee_id, financial_year, regime,
    section_80c, section_80d, hra, lta, other_deductions
  } = req.body;
  const userRole = req.user.role;
  const userId = req.user.userId;

  // RBAC: Standard employees can only submit for themselves. 
  // We must find their employee_id first.
  const empRes = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
  const currentUserEmployeeId = empRes.rows[0]?.employee_id;

  let targetEmployeeId = employee_id || currentUserEmployeeId;
  if (!targetEmployeeId) {
    throw new ValidationError('Employee ID is required');
  }

  if (userRole !== 'admin' && parseInt(targetEmployeeId) !== currentUserEmployeeId) {
    throw new ForbiddenError('Security Violation: You can only submit tax declarations for your own profile.');
  }

  // Check for existing declaration
  const existing = await query(
    'SELECT * FROM tax_declarations WHERE employee_id = $1 AND financial_year = $2',
    [targetEmployeeId, financial_year]
  );

  if (existing.rows.length > 0) {
    // Update existing
    const result = await query(
      `UPDATE tax_declarations 
               SET regime = $1, section_80c = $2, section_80d = $3, hra = $4, lta = $5, other_deductions = $6, status = 'pending', updated_at = CURRENT_TIMESTAMP
               WHERE declaration_id = $7 RETURNING *`,
      [regime, section_80c || 0, section_80d || 0, hra || 0, lta || 0, other_deductions || 0, existing.rows[0].declaration_id]
    );
    return res.json({ success: true, message: 'Tax declaration updated successfully', data: result.rows[0] });
  }

  const result = await query(
    `INSERT INTO tax_declarations 
          (employee_id, financial_year, regime, section_80c, section_80d, hra, lta, other_deductions)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [targetEmployeeId, financial_year, regime, section_80c || 0, section_80d || 0, hra || 0, lta || 0, other_deductions || 0]
  );

  res.status(201).json({ success: true, message: 'Tax declaration submitted successfully', data: result.rows[0] });
});

// Get Tax Declarations
const getTaxDeclarations = asyncHandler(async (req, res) => {
  const { employee_id, financial_year, status } = req.query;
  const userRole = req.user.role;
  const userId = req.user.userId;

  let queryText = 'SELECT td.*, e.first_name, e.last_name FROM tax_declarations td JOIN employees e ON td.employee_id = e.employee_id WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  // RBAC: If not admin, force filter by user's own employee_id
  if (userRole !== 'admin') {
    const empRes = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
    const currentEmpId = empRes.rows[0]?.employee_id;

    queryText += ` AND td.employee_id = $${paramIndex}`;
    params.push(currentEmpId);
    paramIndex++;
  } else if (employee_id) {
    // Admins can filter by specific employee_id if they want
    queryText += ` AND td.employee_id = $${paramIndex}`;
    params.push(employee_id);
    paramIndex++;
  }
  if (financial_year) {
    queryText += ` AND td.financial_year = $${paramIndex}`;
    params.push(financial_year);
    paramIndex++;
  }
  if (status) {
    queryText += ` AND td.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  const result = await query(queryText, params);
  res.json({ success: true, data: result.rows });
});

// Update Tax Declaration Status (Admin)
const updateTaxDeclarationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params; // declaration_id
  const { status, admin_comments } = req.body;

  const result = await query(
    `UPDATE tax_declarations 
           SET status = $1, admin_comments = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE declaration_id = $3 RETURNING *`,
    [status, admin_comments, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Declaration not found');
  }

  res.json({ success: true, message: 'Status updated successfully', data: result.rows[0] });
});

// Get payslips for the currently authenticated employee
const getMyPayslips = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await query(
    `SELECT p.*, e.first_name, e.last_name, e.position, d.department_name
     FROM payroll p
     JOIN employees e ON p.employee_id = e.employee_id
     LEFT JOIN departments d ON e.department_id = d.department_id
     WHERE e.user_id = $1
     ORDER BY p.year DESC, p.month DESC`,
    [userId]
  );
  res.json({ success: true, data: result.rows });
});

// Get payslip by payroll ID (detailed)
const getPayslipById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userId = req.user.userId;

  let queryText = `
    SELECT p.*, 
           e.first_name || ' ' || e.last_name as employee_name,
           e.first_name, e.last_name, e.position, e.email, e.phone,
           d.department_name,
           (SELECT setting_value FROM settings WHERE setting_key = 'company_name') as company_name,
           (SELECT setting_value FROM settings WHERE setting_key = 'company_address') as company_address,
           (SELECT setting_value FROM settings WHERE setting_key = 'company_email') as company_email,
           (SELECT setting_value FROM settings WHERE setting_key = 'company_phone') as company_phone
    FROM payroll p
    JOIN employees e ON p.employee_id = e.employee_id
    LEFT JOIN departments d ON e.department_id = d.department_id
    WHERE p.payroll_id = $1`;

  const params = [id];

  if (userRole === 'employee') {
    queryText += ` AND e.user_id = $2`;
    params.push(userId);
  }

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Payslip not found or access denied');
  }

  const payslip = result.rows[0];
  const totalEarnings = parseFloat(payslip.basic_salary || 0) + parseFloat(payslip.allowances || 0) + parseFloat(payslip.overtime_pay || 0) + parseFloat(payslip.bonus || 0);
  const totalDeductions = parseFloat(payslip.deductions || 0) + parseFloat(payslip.tax || 0);

  res.json({
    success: true,
    data: {
      payslip_id: payslip.payroll_id,
      employee_name: payslip.employee_name,
      employee_id: payslip.employee_id,
      department: payslip.department_name,
      position: payslip.position,
      email: payslip.email,
      phone: payslip.phone,
      period: { month: payslip.month, year: payslip.year },
      company: {
        name: payslip.company_name,
        address: payslip.company_address,
        email: payslip.company_email,
        phone: payslip.company_phone,
      },
      earnings: {
        basic_salary: parseFloat(payslip.basic_salary || 0),
        allowances: parseFloat(payslip.allowances || 0),
        overtime_pay: parseFloat(payslip.overtime_pay || 0),
        bonus: parseFloat(payslip.bonus || 0),
        total_earnings: totalEarnings,
      },
      deductions: {
        tax: parseFloat(payslip.tax || 0),
        other_deductions: parseFloat(payslip.deductions || 0),
        total_deductions: totalDeductions,
      },
      net_salary: parseFloat(payslip.net_salary || 0),
      payment_status: payslip.payment_status,
      payment_method: payslip.payment_method,
      payment_date: payslip.payment_date,
      notes: payslip.notes,
      generated_at: payslip.created_at,
    }
  });
});

module.exports = {
  getAllPayroll,
  getPayrollById,
  getPayrollStatistics,
  createPayroll,
  updatePayroll,
  deletePayroll,
  processPayment,
  generateAutomaticPayroll,
  generateBulkPayroll,
  submitTaxDeclaration,
  getTaxDeclarations,
  updateTaxDeclarationStatus,
  getMyPayslips,
  getPayslipById
};
