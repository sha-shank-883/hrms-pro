const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');

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

    let queryText = `SELECT e.*, d.department_name, u.email as user_email, u.role,
              m.first_name as manager_first_name, m.last_name as manager_last_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN users u ON e.user_id = u.user_id
       LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
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
    console.log('Create Employee Body:', JSON.stringify(req.body, null, 2));
    const {
      first_name, last_name, email, phone, date_of_birth,
      gender, address, department_id, position,
      salary, employment_type, status, password, hire_date
    } = req.body;

    // Start transaction
    await transaction(async (client) => {
      // Check if user already exists
      const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userCheck.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Create user account
      // Use provided password or default 'employee123'
      const userPassword = password || 'employee123';
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id`,
        [email, hashedPassword, 'employee', true]
      );

      const newUserId = userResult.rows[0].user_id;

      // Helper to ensure valid JSON for DB
      const safeJSON = (data, fallback) => {
        if (!data) return fallback;
        if (typeof data === 'object') return data;
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('JSON parse error for field:', data);
          return fallback;
        }
      };

      // Create employee record
      const employeeResult = await client.query(
        `INSERT INTO employees (
          user_id, first_name, last_name, email, phone, date_of_birth,
          gender, address, department_id, position,
          salary, employment_type, status,
          reporting_manager_id, social_links, education, experience, about_me, hire_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          newUserId, first_name, last_name, email, phone, date_of_birth,
          gender, address, department_id || null, position,
          salary || null, employment_type || 'full-time', status || 'active',
          req.body.reporting_manager_id || null,
          safeJSON(req.body.social_links, {}),
          safeJSON(req.body.education, []),
          safeJSON(req.body.experience, []),
          req.body.about_me || null,
          hire_date || new Date().toISOString().split('T')[0] // Default to today if missing
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employeeResult.rows[0],
      });

      if (req.io && req.tenant) {
        req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'EMPLOYEE' });
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    if (error.message === 'User with this email already exists') {
      return res.status(400).json({ success: false, message: error.message });
    }
    // For other errors (transaction rolled back automatically by helper)
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
             about_me = $8, social_links = $9, education = $10, experience = $11,
             updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $12
         RETURNING *`,
        [
          first_name, last_name, phone, date_of_birth,
          gender, address, profile_image || null,
          req.body.about_me || null, req.body.social_links || {},
          req.body.education || [], req.body.experience || [],
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
           reporting_manager_id = $13, social_links = $14, education = $15, experience = $16, about_me = $17,
           updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $18
       RETURNING *`,
      [
        first_name, last_name, phone, date_of_birth,
        gender, address, department_id || null, position,
        salary || null, employment_type, status || 'active', profile_image || null,
        req.body.reporting_manager_id || null, req.body.social_links || {},
        req.body.education || [], req.body.experience || [], req.body.about_me || null,
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

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'EMPLOYEE' });
    }
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

    // Start transaction using helper
    await transaction(async (client) => {
      // Nullify references in other tables to prevent foreign key constraint violations
      await client.query('UPDATE leave_requests SET approved_by = NULL WHERE approved_by = $1', [userId]);
      await client.query('UPDATE job_postings SET posted_by = NULL WHERE posted_by = $1', [userId]);
      await client.query('UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = $1', [userId]);

      // Delete employee first
      await client.query('DELETE FROM employees WHERE employee_id = $1', [id]);

      // Then delete the associated user
      await client.query('DELETE FROM users WHERE user_id = $1', [userId]);

      if (req.io && req.tenant) {
        req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'EMPLOYEE' });
      }
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });

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
    await transaction(async (client) => {
      // Find user by email
      const userResult = await client.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found with this email');
      }

      const userId = userResult.rows[0].user_id;

      // Delete all related records first (due to foreign key constraints)
      // Delete task assignments
      await client.query('DELETE FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete task updates
      await client.query('DELETE FROM task_updates WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete payroll records
      await client.query('DELETE FROM payroll WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete leave requests
      await client.query('DELETE FROM leave_requests WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete attendance records
      await client.query('DELETE FROM attendance WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete job applications (if any)
      await client.query('DELETE FROM job_applications WHERE email = $1', [email]);

      // Delete documents
      await client.query('DELETE FROM documents WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);

      // Delete chat messages
      await client.query('DELETE FROM chat_messages WHERE sender_id IN (SELECT user_id FROM employees WHERE user_id = $1) OR receiver_id IN (SELECT user_id FROM employees WHERE user_id = $1)', [userId]);

      // Nullify references in other tables
      await client.query('UPDATE leave_requests SET approved_by = NULL WHERE approved_by = $1', [userId]);
      await client.query('UPDATE job_postings SET posted_by = NULL WHERE posted_by = $1', [userId]);
      await client.query('UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = $1', [userId]);

      // Delete employees (should cascade to users due to foreign key constraint, but we'll do it explicitly)
      await client.query('DELETE FROM employees WHERE user_id = $1', [userId]);

      // Delete the user
      await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
    });

    res.json({
      success: true,
      message: 'All records for employee with email ' + email + ' deleted successfully',
    });

  } catch (error) {
    console.error('Delete employee by email error:', error);
    if (error.message === 'User not found with this email') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
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


// Get Org Chart Data
const getOrgChart = async (req, res) => {
  try {
    // Fetch all active employees with minimal fields
    const queryText = `
      SELECT e.employee_id, e.first_name, e.last_name, e.position, e.profile_image, 
             e.reporting_manager_id, e.department_id, d.department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.status = 'active'
    `;

    const result = await query(queryText);

    // The frontend will handle the tree construction logic
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get org chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch org chart data',
      error: error.message
    });
  }
};

// Partial update employee (PATCH)
const patchEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const currentUserId = req.user.userId;

    // Check if employee is updating their own profile
    if (userRole === 'employee') {
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
    }

    // Build dynamic update query
    const fields = Object.keys(req.body).filter(key =>
      ['first_name', 'last_name', 'phone', 'date_of_birth', 'gender', 'address',
        'department_id', 'position', 'salary', 'employment_type', 'status',
        'profile_image', 'reporting_manager_id', 'social_links', 'education',
        'experience', 'about_me'].includes(key)
    );

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map(field => {
      // Handle JSON fields
      if (['social_links', 'education', 'experience'].includes(field)) {
        return (typeof req.body[field] === 'string' && req.body[field] !== null) ? req.body[field] : JSON.stringify(req.body[field] || []);
      }
      return req.body[field];
    });

    const queryText = `
      UPDATE employees 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $${fields.length + 1}
      RETURNING *
    `;

    const result = await query(queryText, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'EMPLOYEE' });
    }
  } catch (error) {
    console.error('Patch employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message,
    });
  }
};

// Generate Employee QR Code
const getEmployeeQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const currentUserId = req.user.userId;

    // Fetch minimal employee data
    const queryText = `
      SELECT e.employee_id, e.user_id, e.first_name, e.last_name, 
             e.position, e.department_id, d.department_name, e.hire_date
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.employee_id = $1
    `;
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employee = result.rows[0];

    // Check permissions
    if (userRole === 'employee' && employee.user_id !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Generate QR Code Data
    // Generate QR code data as a URL to the public view
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = `${frontendUrl}/view/id-card/${id}`;

    const qrCodeUrl = await qrcode.toDataURL(qrData);

    res.json({
      success: true,
      qrCodeUrl
    });

  } catch (error) {
    console.error('Get QR Code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
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
  getEmployeesForChat,
  getOrgChart,
  patchEmployee,
  getEmployeeQRCode
};