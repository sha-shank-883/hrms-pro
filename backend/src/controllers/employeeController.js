const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all employees with pagination
const getAllEmployees = async (req, res) => {
  try {
    const { department_id, status, search, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT e.*, d.department_name, u.email as user_email, u.role
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON e.user_id = u.user_id
      WHERE 1=1
    `;
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON e.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering: employees can only see their own data
    if (userRole === 'employee') {
      queryText += ` AND e.user_id = $${paramCount}`;
      countQueryText += ` AND e.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND e.department_id = $${paramCount}`;
      countQueryText += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND e.status = $${paramCount}`;
      countQueryText += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (e.first_name ILIKE $${paramCount} OR e.last_name ILIKE $${paramCount} OR e.email ILIKE $${paramCount})`;
      countQueryText += ` AND (e.first_name ILIKE $${paramCount} OR e.last_name ILIKE $${paramCount} OR e.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ' ORDER BY e.created_at DESC';

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
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message,
    });
  }
};

// Get single employee
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let queryText = `SELECT e.*, d.department_name, u.email as user_email, u.role
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN users u ON e.user_id = u.user_id
       WHERE e.employee_id = $1`;

    const params = [id];

    // Role-based access: employees can only view their own record
    if (userRole === 'employee') {
      queryText += ' AND e.user_id = $2';
      params.push(userId);
    }

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: userRole === 'employee' ? 'Unauthorized access' : 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message,
    });
  }
};

// Get employee by user ID
const getEmployeeByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT e.*, d.department_name 
       FROM employees e 
       LEFT JOIN departments d ON e.department_id = d.department_id 
       WHERE e.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get employee by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message,
    });
  }
};

// Create employee
const createEmployee = async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      gender, address, department_id, position,
      salary, employment_type, status, password
    } = req.body;

    // Start transaction
    await query('BEGIN');

    try {
      // Check if user already exists
      const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (userCheck.rows.length > 0) {
        await query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Create user account
      // Use provided password or default 'employee123'
      const userPassword = password || 'employee123';
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      const userResult = await query(
        `INSERT INTO users (email, password, role, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id`,
        [email, hashedPassword, 'employee', true]
      );

      const newUserId = userResult.rows[0].user_id;

      // Create employee record
      const employeeResult = await query(
        `INSERT INTO employees (
          user_id, first_name, last_name, email, phone, date_of_birth,
          gender, address, department_id, position,
          salary, employment_type, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          newUserId, first_name, last_name, email, phone, date_of_birth,
          gender, address, department_id || null, position,
          salary || null, employment_type || 'full-time', status || 'active'
        ]
      );

      await query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employeeResult.rows[0],
      });
    } catch (transactionError) {
      await query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message,
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const currentUserId = req.user.userId;
    const {
      first_name, last_name, phone, date_of_birth,
      gender, address, department_id, position,
      salary, employment_type, status, profile_image
    } = req.body;

    // Check if employee is updating their own profile
    if (userRole === 'employee') {
      // Verify this employee belongs to this user
      const checkResult = await query(
        'SELECT employee_id FROM employees WHERE employee_id = $1 AND user_id = $2',
        [id, currentUserId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile',
        });
      }

      // Employees can only update limited fields
      const updateResult = await query(
        `UPDATE employees 
         SET first_name = $1, last_name = $2, phone = $3, date_of_birth = $4,
             gender = $5, address = $6, profile_image = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $8
         RETURNING *`,
        [
          first_name, last_name, phone, date_of_birth,
          gender, address, profile_image || null,
          id
        ]
      );

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updateResult.rows[0],
      });
    }

    // Admin/Manager can update all fields
    const adminUpdateResult = await query(
      `UPDATE employees 
       SET first_name = $1, last_name = $2, phone = $3, date_of_birth = $4,
           gender = $5, address = $6, department_id = $7, position = $8,
           salary = $9, employment_type = $10, status = $11, profile_image = $12,
           updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $13
       RETURNING *`,
      [
        first_name, last_name, phone, date_of_birth,
        gender, address, department_id || null, position,
        salary || null, employment_type, status || 'active', profile_image || null,
        id
      ]
    );

    if (adminUpdateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: adminUpdateResult.rows[0],
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message,
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user_id before deleting
    const employeeResult = await query(
      'SELECT user_id FROM employees WHERE employee_id = $1',
      [id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const userId = employeeResult.rows[0].user_id;

    // Start transaction
    await query('BEGIN');

    try {
      // Delete employee first
      await query('DELETE FROM employees WHERE employee_id = $1', [id]);

      // Then delete the associated user
      await query('DELETE FROM users WHERE user_id = $1', [userId]);

      // Commit transaction
      await query('COMMIT');

      res.json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (transactionError) {
      // Rollback transaction
      await query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message,
    });
  }
};

// Delete employee by email (admin only)
const deleteEmployeeByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Find user by email
      const userResult = await query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found with this email',
        });
      }

      const userId = userResult.rows[0].user_id;

      // Delete all related records first (due to foreign key constraints)
      // Delete task assignments
      await query('DELETE FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete task updates
      await query('DELETE FROM task_updates WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete payroll records
      await query('DELETE FROM payroll WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete leave requests
      await query('DELETE FROM leave_requests WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete attendance records
      await query('DELETE FROM attendance WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete job applications (if any)
      await query('DELETE FROM job_applications WHERE email = $1', [email]);

      // Delete documents
      await query('DELETE FROM documents WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete chat messages
      await query('DELETE FROM chat_messages WHERE sender_id IN (SELECT user_id FROM employees WHERE user_id = $1) OR receiver_id IN (SELECT user_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete employees (should cascade to users due to foreign key constraint, but we'll do it explicitly)
      await query('DELETE FROM employees WHERE user_id = $1', [userId]);

      // Delete the user
      await query('DELETE FROM users WHERE user_id = $1', [userId]);

      // Commit transaction
      await query('COMMIT');

      res.json({
        success: true,
        message: 'All records for employee with email ' + email + ' deleted successfully',
      });
    } catch (transactionError) {
      // Rollback transaction
      await query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Delete employee by email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee records',
      error: error.message,
    });
  }
};

// Get all employees for chat (simplified data for chat purposes)
const getEmployeesForChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { search } = req.query; // Get search parameter

    // Validate userId
    if (!userId) {
      throw new Error('User ID is missing from request');
    }

    // Make sure userId is a number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID: ' + userId);
    }

    // For chat purposes, employees should be able to see all other employees
    // but with limited information for privacy
    let queryText = `
      SELECT e.employee_id, e.user_id, e.first_name, e.last_name, e.email, 
             e.position, COALESCE(d.department_name, '') as department_name, u.is_active
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON e.user_id = u.user_id
      WHERE e.user_id != $1 AND u.is_active = true`;

    const params = [userIdNum];
    let paramCount = 2;

    // Add search filter if provided
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      queryText += ` AND (LOWER(e.first_name) LIKE $${paramCount} OR LOWER(e.last_name) LIKE $${paramCount} OR LOWER(e.email) LIKE $${paramCount} OR LOWER(d.department_name) LIKE $${paramCount})`;
      params.push(searchTerm);
      paramCount++;
    }

    queryText += ' ORDER BY e.first_name, e.last_name';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get employees for chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees for chat',
      error: error.message,
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  getEmployeeByUserId,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  deleteEmployeeByEmail,
  getEmployeesForChat
};