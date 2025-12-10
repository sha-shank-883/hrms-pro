const { query } = require('../config/database');

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message,
    });
  }
};

// Get single department
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT d.*, 
              e.first_name || ' ' || e.last_name as manager_name
       FROM departments d
       LEFT JOIN employees e ON d.manager_id = e.employee_id
       WHERE d.department_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message,
    });
  }
};

// Create department
const createDepartment = async (req, res) => {
  try {
    const { department_name, description, manager_id, budget, location } = req.body;

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
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message,
    });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
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
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message,
    });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department has employees
    const employeeCheck = await query(
      'SELECT COUNT(*) as count FROM employees WHERE department_id = $1',
      [id]
    );

    if (parseInt(employeeCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with assigned employees',
      });
    }

    const result = await query(
      'DELETE FROM departments WHERE department_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message,
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
