const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../utils/errors');

const getAllEmployees = asyncHandler(async (req, res) => {
  const { department_id, status, search, page = 1, limit = 10 } = req.query;
  const userRole = req.user.role;
  const userId = req.user.userId;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
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
  queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  const paginatedParams = [...params, limitNum, offset];

  const countResult = await query(countQueryText, params);
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limitNum);

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

const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id % 1 !== 0) throw new ValidationError('Invalid employee ID');
  const userRole = req.user.role;
  const userId = req.user.userId;

  let queryText = `SELECT e.*, d.department_name, u.email as user_email, u.role, u.permissions,
            m.first_name as manager_first_name, m.last_name as manager_last_name
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.department_id
     LEFT JOIN users u ON e.user_id = u.user_id
     LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
     WHERE e.employee_id = $1`;

  const params = [id];

  if (userRole === 'employee') {
    queryText += ' AND e.user_id = $2';
    params.push(userId);
  }

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw userRole === 'employee'
      ? new ForbiddenError('Unauthorized access')
      : new NotFoundError('Employee not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

const getEmployeeByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await query(
    `SELECT e.*, d.department_name, u.role, u.permissions 
     FROM employees e 
     LEFT JOIN departments d ON e.department_id = d.department_id 
     LEFT JOIN users u ON e.user_id = u.user_id
     WHERE e.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Employee not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

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

const createEmployee = asyncHandler(async (req, res) => {
  const {
    first_name, last_name, email, phone, date_of_birth,
    gender, address, department_id, position,
    salary, employment_type, status, password, hire_date
  } = req.body;

  if (first_name && first_name.length > 100) throw new ValidationError('First name must not exceed 100 characters');
  if (last_name && last_name.length > 100) throw new ValidationError('Last name must not exceed 100 characters');
  if (position && position.length > 100) throw new ValidationError('Position must not exceed 100 characters');

  // Enforce Tenant Employee Seat Limit
  const tenantId = req.tenant?.tenant_id;
  if (tenantId) {
    const tenantRes = await query(
      `SELECT employee_limit, subscription_plan FROM shared.tenants WHERE tenant_id = $1`,
      [tenantId]
    );
    if (tenantRes.rows.length > 0) {
      const seatLimit = tenantRes.rows[0].employee_limit || 15;
      const countRes = await query(
        `SELECT COUNT(*) FROM "${tenantId}".employees WHERE status = 'active'`
      );
      const activeCount = parseInt(countRes.rows[0].count, 10);
      if (activeCount >= seatLimit) {
        throw new ForbiddenError(
          `Employee seat limit reached (${activeCount}/${seatLimit} seats used). Please scale your employee seats under Settings > Billing & Plan.`
        );
      }
    }
  }

  await transaction(async (client) => {
    const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    const userPassword = password || 'employee123';
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id`,
      [email, hashedPassword, 'employee', true]
    );

    const newUserId = userResult.rows[0].user_id;

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
        newUserId, first_name, last_name, email, phone || null, date_of_birth || null,
        gender, address || null, department_id || null, position || null,
        salary || null, employment_type || 'full-time', status || 'active',
        req.body.reporting_manager_id || null,
        safeJSON(req.body.social_links, {}),
        safeJSON(req.body.education, []),
        safeJSON(req.body.experience, []),
        req.body.about_me || null,
        hire_date || new Date().toISOString().split('T')[0]
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
});

const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id % 1 !== 0) throw new ValidationError('Invalid employee ID');
  const userRole = req.user.role;
  const currentUserId = req.user.userId;

  if (userRole === 'employee') {
    const checkResult = await query(
      'SELECT employee_id FROM employees WHERE employee_id = $1 AND user_id = $2',
      [id, currentUserId]
    );

    if (checkResult.rows.length === 0) {
      throw new ForbiddenError('You can only update your own profile');
    }

    const allowedFields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'gender', 'address', 'profile_image', 'about_me', 'social_links', 'education', 'experience'];
    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = $${paramIdx++}`);
        values.push(req.body[field]);
      }
    }

    if (setClauses.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    const updateResult = await query(
      `UPDATE employees SET ${setClauses.join(', ')} WHERE employee_id = $${paramIdx} RETURNING *`,
      [...values, id]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updateResult.rows[0],
    });
  }

  const adminFields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'gender', 'address', 'department_id', 'position', 'salary', 'employment_type', 'status', 'profile_image', 'reporting_manager_id', 'about_me', 'social_links', 'education', 'experience'];
  const setClauses = [];
  const values = [];
  let paramIdx = 1;

  for (const field of adminFields) {
    if (req.body[field] !== undefined) {
      setClauses.push(`${field} = $${paramIdx++}`);
      values.push(req.body[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  const adminUpdateResult = await query(
    `UPDATE employees SET ${setClauses.join(', ')} WHERE employee_id = $${paramIdx} RETURNING *`,
    [...values, id]
  );

  if (adminUpdateResult.rows.length === 0) {
    throw new NotFoundError('Employee not found');
  }

  res.json({
    success: true,
    message: 'Employee updated successfully',
    data: adminUpdateResult.rows[0],
  });

  if (req.io && req.tenant) {
    req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'EMPLOYEE' });
  }
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id % 1 !== 0) throw new ValidationError('Invalid employee ID');

  const employeeResult = await query(
    'SELECT user_id FROM employees WHERE employee_id = $1',
    [id]
  );

  if (employeeResult.rows.length === 0) {
    throw new NotFoundError('Employee not found');
  }

  const userId = employeeResult.rows[0].user_id;

  await transaction(async (client) => {
    // Check if the linked user is an Admin
    let isAdminUser = false;
    if (userId) {
      const userRes = await client.query('SELECT role FROM users WHERE user_id = $1', [userId]);
      if (userRes.rows.length > 0 && userRes.rows[0].role === 'admin') {
        isAdminUser = true;
      }
    }

    await client.query('UPDATE leave_requests SET approved_by = NULL WHERE approved_by = $1', [userId]);
    await client.query('UPDATE job_postings SET posted_by = NULL WHERE posted_by = $1', [userId]);
    await client.query('UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = $1', [userId]);
    await client.query('DELETE FROM employees WHERE employee_id = $1', [id]);

    // NEVER delete the Workspace Admin user account
    if (userId && !isAdminUser) {
      await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
    }

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'EMPLOYEE' });
    }
  });

  res.json({
    success: true,
    message: 'Employee deleted successfully',
  });
});

const deleteEmployeeByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  await transaction(async (client) => {
    const userResult = await client.query(
      'SELECT user_id, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // If user not found, delete any matching employee by email directly
      await client.query('DELETE FROM employees WHERE email = $1', [email]);
      return;
    }

    const { user_id: userId, role } = userResult.rows[0];
    const isAdminUser = (role === 'admin');

    await client.query('DELETE FROM task_assignments WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);
    await client.query('DELETE FROM task_updates WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);
    await client.query('DELETE FROM payroll WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);
    await client.query('DELETE FROM leave_requests WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);
    await client.query('DELETE FROM attendance WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);
    await client.query('DELETE FROM job_applications WHERE email = $1', [email]);
    await client.query('DELETE FROM documents WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id = $1)', [userId]);
    await client.query('DELETE FROM chat_messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await client.query('UPDATE leave_requests SET approved_by = NULL WHERE approved_by = $1', [userId]);
    await client.query('UPDATE job_postings SET posted_by = NULL WHERE posted_by = $1', [userId]);
    await client.query('UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = $1', [userId]);
    await client.query('DELETE FROM employees WHERE user_id = $1 OR email = $2', [userId, email]);

    // NEVER delete the Workspace Admin user account
    if (!isAdminUser) {
      await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
    }
  });

  res.json({
    success: true,
    message: `All records for employee with email ${email} deleted successfully`,
  });
});

const getEmployeesForChat = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { search } = req.query;

  if (!userId) {
    throw new ValidationError('User ID is missing from request');
  }

  const userIdNum = parseInt(userId);
  if (isNaN(userIdNum)) {
    throw new ValidationError('Invalid user ID');
  }

  let queryText = `
    SELECT e.employee_id, e.user_id, e.first_name, e.last_name, e.email, 
           e.position, COALESCE(d.department_name, '') as department_name, u.is_active
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    LEFT JOIN users u ON e.user_id = u.user_id
    WHERE e.user_id != $1 AND u.is_active = true`;

  const params = [userIdNum];
  let paramCount = 2;

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
});

const getOrgChart = asyncHandler(async (req, res) => {
  const queryText = `
    SELECT e.employee_id, e.first_name, e.last_name, e.position, e.profile_image, 
           e.reporting_manager_id, e.department_id, d.department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    WHERE e.status = 'active'
  `;

  const result = await query(queryText);

  res.json({
    success: true,
    data: result.rows
  });
});

const patchEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id % 1 !== 0) throw new ValidationError('Invalid employee ID');
  const userRole = req.user.role;
  const currentUserId = req.user.userId;

  if (userRole === 'employee') {
    const checkResult = await query(
      'SELECT employee_id FROM employees WHERE employee_id = $1 AND user_id = $2',
      [id, currentUserId]
    );

    if (checkResult.rows.length === 0) {
      throw new ForbiddenError('You can only update your own profile');
    }
  }

  const fields = Object.keys(req.body).filter(key =>
    ['first_name', 'last_name', 'phone', 'date_of_birth', 'gender', 'address',
      'department_id', 'position', 'salary', 'employment_type', 'status',
      'profile_image', 'reporting_manager_id', 'social_links', 'education',
      'experience', 'about_me'].includes(key)
  );

  if (fields.length === 0) {
    throw new ValidationError('No valid fields provided for update');
  }

  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  const values = fields.map(field => {
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
    throw new NotFoundError('Employee not found');
  }

  res.json({
    success: true,
    message: 'Employee updated successfully',
    data: result.rows[0],
  });

  if (req.io && req.tenant) {
    req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'EMPLOYEE' });
  }
});

const getEmployeeQRCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const currentUserId = req.user.userId;

  const queryText = `
    SELECT e.employee_id, e.user_id, e.first_name, e.last_name, 
           e.position, e.department_id, d.department_name, e.hire_date
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    WHERE e.employee_id = $1
  `;
  const result = await query(queryText, [id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('Employee not found');
  }

  const employee = result.rows[0];

  if (userRole === 'employee' && employee.user_id !== currentUserId) {
    throw new ForbiddenError('Unauthorized');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const qrData = `${frontendUrl}/view/id-card/${id}`;

  const qrCodeUrl = await qrcode.toDataURL(qrData);

  res.json({
    success: true,
    qrCodeUrl
  });
});

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
