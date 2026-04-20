const { query } = require('../config/database');

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        data: {
          employees: [],
          tasks: [],
          departments: [],
          documents: [],
          assets: [],
          job_postings: [],
          job_applications: []
        }
      });
    }

    const searchTerm = `%${q.trim()}%`;
    const searchTasks = [];

    // 1. Search Employees
    let employeeQueryText = `
      SELECT e.employee_id, e.first_name, e.last_name, e.email, e.position, d.department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON e.user_id = u.user_id
      WHERE (e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.email ILIKE $1 OR e.employee_id::text ILIKE $1)
      AND u.is_active = true
      ORDER BY e.first_name ASC
      LIMIT 5
    `;
    searchTasks.push(query(employeeQueryText, [searchTerm]));

    // 2. Search Departments
    let departmentQueryText = `
      SELECT department_id, department_name, description
      FROM departments
      WHERE department_name ILIKE $1 OR department_id::text ILIKE $1
      ORDER BY department_name ASC
      LIMIT 5
    `;
    searchTasks.push(query(departmentQueryText, [searchTerm]));

    // 3. Search Tasks
    let taskParams = [searchTerm];
    let paramCount = 2;
    let taskQueryText = `
      SELECT t.task_id, t.title, t.status, t.priority 
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN employees e ON ta.employee_id = e.employee_id
      WHERE (t.title ILIKE $1 OR t.description ILIKE $1 OR t.task_id::text ILIKE $1)
    `;
    if (userRole === 'employee') {
      taskQueryText += ` AND (t.created_by = $${paramCount} OR e.user_id = $${paramCount})`;
      taskParams.push(userId);
      paramCount++;
    }
    taskQueryText += ` GROUP BY t.task_id ORDER BY t.created_at DESC LIMIT 5`;
    searchTasks.push(query(taskQueryText, taskParams));

    // 4. Search Documents
    let docParams = [searchTerm];
    let docParamCount = 2;
    let docQueryText = `
      SELECT document_id, document_name, document_type, is_confidential 
      FROM documents d
      WHERE (document_name ILIKE $1 OR description ILIKE $1 OR document_id::text ILIKE $1)
    `;
    if (userRole === 'employee') {
      // Need employee id for the user
      const empRes = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
      if (empRes.rows.length > 0) {
        docQueryText += ` AND (d.employee_id = $${docParamCount} OR d.is_confidential = false)`;
        docParams.push(empRes.rows[0].employee_id);
      } else {
        docQueryText += ` AND d.is_confidential = false`;
      }
    }
    docQueryText += ` ORDER BY created_at DESC LIMIT 5`;
    searchTasks.push(query(docQueryText, docParams));

    // 5. Search Assets
    let assetQueryText = `
      SELECT asset_id, name, serial_number, type, status 
      FROM assets 
      WHERE (name ILIKE $1 OR serial_number ILIKE $1 OR type ILIKE $1 OR asset_id::text ILIKE $1)
      ORDER BY created_at DESC LIMIT 5
    `;
    searchTasks.push(query(assetQueryText, [searchTerm]));

    // 6. Search Job Postings
    let jobPostingQueryText = `
      SELECT job_id, title, position_type, status 
      FROM job_postings 
      WHERE (title ILIKE $1 OR position_type ILIKE $1 OR job_id::text ILIKE $1)
      ORDER BY created_at DESC LIMIT 5
    `;
    searchTasks.push(query(jobPostingQueryText, [searchTerm]));

    // 7. Search Job Applications (Admin/Manager only)
    if (userRole === 'admin' || userRole === 'manager') {
      let jobAppQueryText = `
        SELECT application_id, applicant_name, email, status 
        FROM job_applications 
        WHERE (applicant_name ILIKE $1 OR email ILIKE $1 OR application_id::text ILIKE $1)
        ORDER BY created_at DESC LIMIT 5
      `;
      searchTasks.push(query(jobAppQueryText, [searchTerm]));
    } else {
      searchTasks.push(Promise.resolve({ rows: [] })); // Empty for employees
    }

    const [
      employeeResult, 
      departmentResult, 
      taskResult, 
      docResult, 
      assetResult,
      jobPostingResult,
      jobAppResult
    ] = await Promise.all(searchTasks);

    res.json({
      success: true,
      data: {
        employees: employeeResult.rows,
        departments: departmentResult.rows,
        tasks: taskResult.rows,
        documents: docResult.rows,
        assets: assetResult.rows,
        job_postings: jobPostingResult.rows,
        job_applications: jobAppResult.rows
      }
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform global search',
      error: error.message
    });
  }
};

module.exports = {
  globalSearch
};
