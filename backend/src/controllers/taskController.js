const { query } = require('../config/database');

// Get all tasks with pagination
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, department_id, assigned_to, category, search, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT t.*, 
             d.department_name,
             u.email as created_by_email,
             COALESCE((
               SELECT json_agg(json_build_object('employee_id', e.employee_id, 'first_name', e.first_name, 'last_name', e.last_name))
               FROM task_assignments ta
               JOIN employees e ON ta.employee_id = e.employee_id
               WHERE ta.task_id = t.task_id
             ), '[]') as assigned_employees,
             ARRAY_AGG(DISTINCT e.employee_id) FILTER (WHERE e.employee_id IS NOT NULL) as assigned_employee_ids,
             ARRAY_AGG(DISTINCT e.department_id) FILTER (WHERE e.employee_id IS NOT NULL) as assigned_employee_department_ids,
             ARRAY_AGG(DISTINCT dept.department_name) FILTER (WHERE e.employee_id IS NOT NULL) as assigned_employee_departments
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.department_id
      LEFT JOIN users u ON t.created_by = u.user_id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN employees e ON ta.employee_id = e.employee_id
      LEFT JOIN departments dept ON e.department_id = dept.department_id
      WHERE 1=1
    `;
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.department_id
      LEFT JOIN users u ON t.created_by = u.user_id
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN employees e ON ta.employee_id = e.employee_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering: employees can only see tasks assigned to them
    if (userRole === 'employee') {
      queryText += ` AND (t.created_by = $${paramCount} OR e.user_id = $${paramCount})`;
      countQueryText += ` AND (t.created_by = $${paramCount} OR e.user_id = $${paramCount})`;
      params.push(userId);
      paramCount++;
    }

    if (status) {
      queryText += ` AND t.status = $${paramCount}`;
      countQueryText += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      queryText += ` AND t.priority = $${paramCount}`;
      countQueryText += ` AND t.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND t.department_id = $${paramCount}`;
      countQueryText += ` AND t.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (assigned_to) {
      queryText += ` AND ta.employee_id = $${paramCount}`;
      countQueryText += ` AND ta.employee_id = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    if (category) {
      queryText += ` AND t.category = $${paramCount}`;
      countQueryText += ` AND t.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Search functionality
    if (search) {
      queryText += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      countQueryText += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ' GROUP BY t.task_id, d.department_name, u.email ORDER BY t.created_at DESC';

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
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
};

// Get single task
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.*, 
              d.department_name,
              u.email as created_by_email,
              COALESCE((
                SELECT json_agg(json_build_object('employee_id', e.employee_id, 'first_name', e.first_name, 'last_name', e.last_name))
                FROM task_assignments ta
                JOIN employees e ON ta.employee_id = e.employee_id
                WHERE ta.task_id = t.task_id
              ), '[]') as assigned_employees,
              ARRAY_AGG(DISTINCT e.employee_id) FILTER (WHERE e.employee_id IS NOT NULL) as assigned_employee_ids,
              ARRAY_AGG(DISTINCT e.department_id) FILTER (WHERE e.employee_id IS NOT NULL) as assigned_employee_department_ids,
              ARRAY_AGG(DISTINCT dept.department_name) FILTER (WHERE e.employee_id IS NOT NULL) as assigned_employee_departments
       FROM tasks t
       LEFT JOIN departments d ON t.department_id = d.department_id
       LEFT JOIN users u ON t.created_by = u.user_id
       LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
       LEFT JOIN employees e ON ta.employee_id = e.employee_id
       LEFT JOIN departments dept ON e.department_id = dept.department_id
       WHERE t.task_id = $1
       GROUP BY t.task_id, d.department_name, u.email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message,
    });
  }
};

// Create task
const createTask = async (req, res) => {
  try {
    const {
      title, description, priority, status, due_date,
      department_id, estimated_hours, assigned_employees, category
    } = req.body;

    const created_by = req.user.userId;

    // Create task
    const result = await query(
      `INSERT INTO tasks (title, description, priority, status, due_date, created_by, department_id, estimated_hours, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, priority || 'medium', status || 'todo', due_date || null, created_by, department_id || null, estimated_hours || null, category || 'general']
    );

    const taskId = result.rows[0].task_id;

    // Assign employees if provided
    if (assigned_employees && assigned_employees.length > 0) {
      for (const employeeId of assigned_employees) {
        await query(
          'INSERT INTO task_assignments (task_id, employee_id) VALUES ($1, $2)',
          [taskId, employeeId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('notification', {
        type: 'TASK_ASSIGNED',
        message: `New task assigned: ${title}`,
        data: result.rows[0]
      });
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'TASK' });
    }
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, priority, status, due_date,
      department_id, estimated_hours, actual_hours, progress,
      assigned_employees, category
    } = req.body;

    // Check if user is authorized to update this task
    const userRole = req.user.role;
    const userId = req.user.userId;

    // If user is employee, check if they created this task
    if (userRole === 'employee') {
      const taskCheck = await query(
        'SELECT created_by FROM tasks WHERE task_id = $1',
        [id]
      );

      if (taskCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      // Employees can only update tasks they created
      if (taskCheck.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks you created',
        });
      }
    }

    const result = await query(
      `UPDATE tasks 
       SET title = $1, description = $2, priority = $3, status = $4, due_date = $5,
           department_id = $6, estimated_hours = $7, actual_hours = $8, progress = $9, category = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE task_id = $11
       RETURNING *`,
      [title, description, priority, status, due_date || null, department_id || null, estimated_hours || null, actual_hours || null, progress || 0, category || 'general', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Update assignments if provided
    if (assigned_employees) {
      // Remove existing assignments
      await query('DELETE FROM task_assignments WHERE task_id = $1', [id]);

      // Add new assignments
      for (const employeeId of assigned_employees) {
        await query(
          'INSERT INTO task_assignments (task_id, employee_id) VALUES ($1, $2)',
          [id, employeeId]
        );
      }
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'TASK' });
    }
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message,
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is authorized to delete this task
    const userRole = req.user.role;
    const userId = req.user.userId;

    // If user is employee, check if they created this task
    if (userRole === 'employee') {
      const taskCheck = await query(
        'SELECT created_by FROM tasks WHERE task_id = $1',
        [id]
      );

      if (taskCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      // Employees can only delete tasks they created
      if (taskCheck.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete tasks you created',
        });
      }
    }

    const result = await query(
      'DELETE FROM tasks WHERE task_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'TASK' });
    }
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
};

// Add task update (daily update from assigned employee)
const addTaskUpdate = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { update_text, hours_spent, progress_percentage, status, attachments } = req.body;
    const user_id = req.user.userId;

    // Get employee_id from user_id
    const employeeResult = await query(
      'SELECT employee_id FROM employees WHERE user_id = $1',
      [user_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    const employee_id = employeeResult.rows[0].employee_id;

    // Verify employee is assigned to this task
    const assignmentCheck = await query(
      'SELECT * FROM task_assignments WHERE task_id = $1 AND employee_id = $2',
      [task_id, employee_id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this task',
      });
    }

    const result = await query(
      `INSERT INTO task_updates (task_id, employee_id, update_text, hours_spent, progress_percentage, status, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [task_id, employee_id, update_text, hours_spent || null, progress_percentage || null, status || null, attachments || null]
    );

    // Update task progress if provided
    if (progress_percentage !== undefined) {
      await query(
        'UPDATE tasks SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE task_id = $2',
        [progress_percentage, task_id]
      );

      // Also update status if provided
      if (status) {
        await query(
          'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE task_id = $2',
          [status, task_id]
        );
      }
    }
    // If no progress_percentage provided but status is provided, calculate progress based on status
    else if (status) {
      let calculatedProgress = 0;
      switch (status) {
        case 'todo':
          calculatedProgress = 0;
          break;
        case 'in_progress':
          calculatedProgress = 50;
          break;
        case 'completed':
          calculatedProgress = 100;
          break;
        case 'cancelled':
          calculatedProgress = 0;
          break;
        default:
          calculatedProgress = 0;
      }
      await query(
        'UPDATE tasks SET progress = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE task_id = $3',
        [calculatedProgress, status, task_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Task update added successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('notification', {
        type: 'TASK_UPDATE',
        message: `Task update submitted for Task #${task_id}`,
        data: { ...result.rows[0], task_id }
      });
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'TASK' });
    }
  } catch (error) {
    console.error('Add task update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add task update',
      error: error.message,
    });
  }
};

// Get task updates
const getTaskUpdates = async (req, res) => {
  try {
    const { task_id } = req.params;

    const result = await query(
      `SELECT tu.*, 
              e.first_name || ' ' || e.last_name as employee_name,
              e.position
       FROM task_updates tu
       JOIN employees e ON tu.employee_id = e.employee_id
       WHERE tu.task_id = $1
       ORDER BY tu.created_at DESC`,
      [task_id]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get task updates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task updates',
      error: error.message,
    });
  }
};

// Update a task update
const updateTaskUpdate = async (req, res) => {
  try {
    const { update_id } = req.params;
    const { update_text, hours_spent, progress_percentage, status, attachments } = req.body;
    const user_id = req.user.userId;

    // Get employee_id from user_id
    const employeeResult = await query(
      'SELECT employee_id FROM employees WHERE user_id = $1',
      [user_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    const employee_id = employeeResult.rows[0].employee_id;

    // Verify employee owns this update
    const ownerCheck = await query(
      'SELECT * FROM task_updates WHERE update_id = $1 AND employee_id = $2',
      [update_id, employee_id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own updates',
      });
    }

    const result = await query(
      `UPDATE task_updates 
       SET update_text = $1, hours_spent = $2, progress_percentage = $3, status = $4, attachments = $5, updated_at = CURRENT_TIMESTAMP
       WHERE update_id = $6
       RETURNING *`,
      [update_text, hours_spent || null, progress_percentage || null, status || null, attachments || null, update_id]
    );

    // Update task progress if provided
    if (progress_percentage !== undefined) {
      await query(
        'UPDATE tasks SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE task_id = (SELECT task_id FROM task_updates WHERE update_id = $2)',
        [progress_percentage, update_id]
      );

      // Also update status if provided
      if (status) {
        await query(
          'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE task_id = (SELECT task_id FROM task_updates WHERE update_id = $2)',
          [status, update_id]
        );
      }
    }
    // If no progress_percentage provided but status is provided, calculate progress based on status
    else if (status) {
      let calculatedProgress = 0;
      switch (status) {
        case 'todo':
          calculatedProgress = 0;
          break;
        case 'in_progress':
          calculatedProgress = 50;
          break;
        case 'completed':
          calculatedProgress = 100;
          break;
        case 'cancelled':
          calculatedProgress = 0;
          break;
        default:
          calculatedProgress = 0;
      }
      await query(
        'UPDATE tasks SET progress = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE task_id = (SELECT task_id FROM task_updates WHERE update_id = $3)',
        [calculatedProgress, status, update_id]
      );
    }

    res.json({
      success: true,
      message: 'Task update updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update task update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task update',
      error: error.message,
    });
  }
};

// Delete task update
const deleteTaskUpdate = async (req, res) => {
  try {
    const { update_id } = req.params;
    const user_id = req.user.userId;

    // Get employee_id from user_id
    const employeeResult = await query(
      'SELECT employee_id FROM employees WHERE user_id = $1',
      [user_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    const employee_id = employeeResult.rows[0].employee_id;

    // Verify employee owns this update
    const ownerCheck = await query(
      'SELECT * FROM task_updates WHERE update_id = $1 AND employee_id = $2',
      [update_id, employee_id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own updates',
      });
    }

    await query('DELETE FROM task_updates WHERE update_id = $1', [update_id]);

    res.json({
      success: true,
      message: 'Task update deleted successfully',
    });
  } catch (error) {
    console.error('Delete task update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task update',
      error: error.message,
    });
  }
};

// Get task statistics
const getTaskStatistics = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;

    let queryText = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
      LEFT JOIN employees e ON ta.employee_id = e.employee_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Role-based filtering: employees can only see tasks assigned to them
    if (userRole === 'employee') {
      queryText += ` AND (t.created_by = $${paramCount} OR e.user_id = $${paramCount})`;
      params.push(userId);
      paramCount++;
    }

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  getTaskStatistics,
  createTask,
  updateTask,
  deleteTask,
  addTaskUpdate,
  getTaskUpdates,
  updateTaskUpdate,
  deleteTaskUpdate,
};
