const { query } = require('../config/database');

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
const getAllPayroll = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll records',
      error: error.message,
    });
  }
};

// Get single payroll record
const getPayrollById = async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found or access denied',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll record',
      error: error.message,
    });
  }
};

// Get payroll statistics
const getPayrollStatistics = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get payroll statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll statistics',
      error: error.message,
    });
  }
};

// Create payroll record
const createPayroll = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Create payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll record',
      error: error.message,
    });
  }
};

// Update payroll record
const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      month, year, basic_salary, allowances, deductions, overtime_pay,
      bonus, tax, payment_status, payment_date, payment_method, notes
    } = req.body;

    // Validate required fields
    if (!month || !year || !basic_salary) {
      return res.status(400).json({
        success: false,
        message: 'Month, year, and basic salary are required',
      });
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
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    res.json({
      success: true,
      message: 'Payroll record updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    // Log more detailed error information
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'A payroll record already exists for this employee and period',
        error: 'UNIQUE_CONSTRAINT_VIOLATION',
      });
    } else if (error.code === '23503') {
      // Foreign key violation
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
        error: 'FOREIGN_KEY_VIOLATION',
      });
    } else if (error.code === '22P02') {
      // Invalid text representation
      return res.status(400).json({
        success: false,
        message: 'Invalid data format provided',
        error: 'INVALID_DATA_FORMAT',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update payroll record',
      error: error.message,
    });
  }
};

// Delete payroll record
const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM payroll WHERE payroll_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    res.json({
      success: true,
      message: 'Payroll record deleted successfully',
    });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll record',
      error: error.message,
    });
  }
};

// Process payment (mark as paid)
const processPayment = async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message,
    });
  }
};

// Generate automatic payroll for an employee
const generateAutomaticPayroll = async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;

    // Validate required fields
    if (!employee_id || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, month, and year are required'
      });
    }

    // Check if payroll already exists for this employee/month/year
    const existingPayroll = await query(
      'SELECT * FROM payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
      [employee_id, month, year]
    );

    if (existingPayroll.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record already exists for this employee and period'
      });
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
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
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
    let leaveDeduction = 0;

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

    // Deduct for unpaid leaves (if any)
    // For simplicity, we'll assume all leaves are paid unless specified otherwise
    // In a real system, you would check leave type to determine if it's paid or unpaid

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
      const grossSalary = baseSalary + allowances + overtimePay -
        (attendanceDeduction + lateArrivalDeduction + earlyDepartureDeduction + leaveDeduction);
      taxAmount = (grossSalary * taxRate) / 100;
    }

    // Calculate final salary components
    const totalDeductions = attendanceDeduction + lateArrivalDeduction +
      earlyDepartureDeduction + leaveDeduction + taxAmount;
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
        `Auto-generated payroll. Present: ${presentDays}, Absent: ${absentDays}, Leave: ${totalLeaveDays}, OT: ${overtimeHours.toFixed(2)}h`
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
  } catch (error) {
    console.error('Generate automatic payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payroll',
      error: error.message,
    });
  }
};

// Generate payroll for all employees in a month
const generateBulkPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    // Validate required fields
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Get all active employees
    const employeesResult = await query(
      'SELECT employee_id, salary FROM employees WHERE status = $1',
      ['active']
    );

    if (employeesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employees found'
      });
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
  } catch (error) {
    console.error('Generate bulk payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bulk payroll',
      error: error.message,
    });
  }
};

// Submit Tax Declaration
const submitTaxDeclaration = async (req, res) => {
  try {
    const {
      employee_id, financial_year, regime,
      section_80c, section_80d, hra, lta, other_deductions
    } = req.body;

    // Check for existing declaration
    const existing = await query(
      'SELECT * FROM tax_declarations WHERE employee_id = $1 AND financial_year = $2',
      [employee_id, financial_year]
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
      [employee_id, financial_year, regime, section_80c || 0, section_80d || 0, hra || 0, lta || 0, other_deductions || 0]
    );

    res.status(201).json({ success: true, message: 'Tax declaration submitted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Submit tax declaration error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit declaration', error: error.message });
  }
};

// Get Tax Declarations
const getTaxDeclarations = async (req, res) => {
  try {
    const { employee_id, financial_year, status } = req.query;
    let queryText = 'SELECT td.*, e.first_name, e.last_name FROM tax_declarations td JOIN employees e ON td.employee_id = e.employee_id WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (employee_id) {
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
  } catch (error) {
    console.error('Get tax declarations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch declarations', error: error.message });
  }
};

// Update Tax Declaration Status (Admin)
const updateTaxDeclarationStatus = async (req, res) => {
  try {
    const { id } = req.params; // declaration_id
    const { status, admin_comments } = req.body;

    const result = await query(
      `UPDATE tax_declarations 
             SET status = $1, admin_comments = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE declaration_id = $3 RETURNING *`,
      [status, admin_comments, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Declaration not found' });
    }

    res.json({ success: true, message: 'Status updated successfully', data: result.rows[0] });

  } catch (error) {
    console.error('Update tax declaration status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

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
  updateTaxDeclarationStatus
};
