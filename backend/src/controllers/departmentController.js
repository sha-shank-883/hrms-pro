const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

// Get all departments
const getAllDepartments = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT d.*, 
           e.first_name || ' ' || e.last_name as manager_name,
           COUNT(DISTINCT emp.employee_id) as employee_count
    FROM departments d
    LEFT JOIN employees e ON d.manager_id = e.employee_id
    LEFT JOIN employees emp ON d.department_id = emp.department_id
    GROUP BY d.department_id, e.first_name, e.last_name
    ORDER BY d.created_at DESC
  `);

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length,
  });
});

// Get single department
const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id % 1 !== 0) throw new ValidationError('Invalid department ID');

  const result = await query(
    `SELECT d.*, 
            e.first_name || ' ' || e.last_name as manager_name
     FROM departments d
     LEFT JOIN employees e ON d.manager_id = e.employee_id
     WHERE d.department_id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Department not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

// Create department
const createDepartment = asyncHandler(async (req, res) => {
  const { department_name, description, manager_id, budget, location } = req.body;

  if (department_name && department_name.length > 255) {
    throw new ValidationError('Department name must not exceed 255 characters');
  }

  // Check for duplicate department name
  const existing = await query('SELECT department_id FROM departments WHERE LOWER(department_name) = LOWER($1)', [department_name]);
  if (existing.rows.length > 0) {
    throw new ConflictError('Department with this name already exists');
  }

  const result = await query(
    `INSERT INTO departments (department_name, description, manager_id, budget, location)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [department_name, description, manager_id || null, budget || null, location]
  );

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: result.rows[0],
  });
});

// Update department
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id % 1 !== 0) throw new ValidationError('Invalid department ID');
  const { department_name, description, manager_id, budget, location } = req.body;

  const result = await query(
    `UPDATE departments 
     SET department_name = $1, description = $2, manager_id = $3, 
         budget = $4, location = $5, updated_at = CURRENT_TIMESTAMP
     WHERE department_id = $6
     RETURNING *`,
    [department_name, description, manager_id || null, budget || null, location, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Department not found');
  }

  res.json({
    success: true,
    message: 'Department updated successfully',
    data: result.rows[0],
  });
});

// Delete department
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || id % 1 !== 0) throw new ValidationError('Invalid department ID');

  // Check if department has employees
  const employeeCheck = await query(
    'SELECT COUNT(*) as count FROM employees WHERE department_id = $1',
    [id]
  );

  if (parseInt(employeeCheck.rows[0].count) > 0) {
    throw new ValidationError('Cannot delete department with assigned employees');
  }

  const result = await query(
    'DELETE FROM departments WHERE department_id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Department not found');
  }

  res.json({
    success: true,
    message: 'Department deleted successfully',
  });
});

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
