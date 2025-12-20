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

// Get leave request by ID
const getLeaveRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let queryText = `
      SELECT lr.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             d.department_name,
             u.email as approver_email
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON lr.approved_by = u.user_id
      WHERE lr.leave_id = $1
    `;
    const params = [id];

    // Role-based filtering: employees can only see their own leave requests
    if (userRole === 'employee') {
      queryText += ` AND e.user_id = $2`;
      params.push(userId);
    }

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or access denied',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave request',
      error: error.message,
    });
  }
};

// Get all leave requests with pagination
const getAllLeaveRequests = async (req, res) => {
  try {
    const { employee_id, status, start_date, end_date, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT lr.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             d.department_name,
             u.email as approver_email
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON lr.approved_by = u.user_id
      WHERE 1=1
    `;
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON lr.approved_by = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering: employees can only see their own leave requests
    if (userRole === 'employee') {
      queryText += ` AND e.user_id = $${paramCount}`;
      countQueryText += ` AND e.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (employee_id) {
      queryText += ` AND lr.employee_id = $${paramCount}`;
      countQueryText += ` AND lr.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND lr.status = $${paramCount}`;
      countQueryText += ` AND lr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      queryText += ` AND lr.start_date >= $${paramCount}`;
      countQueryText += ` AND lr.start_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      queryText += ` AND lr.end_date <= $${paramCount}`;
      countQueryText += ` AND lr.end_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    queryText += ' ORDER BY lr.created_at DESC';

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
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message,
    });
  }
};

// Create leave request
const createLeaveRequest = async (req, res) => {
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;

    // Calculate days count
    const start = new Date(start_date);
    const end = new Date(end_date);
    const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance based on settings
    const leaveApprovalRequired = await getSetting('leave_approval_required', 'true');
    const advanceNoticeDays = parseInt(await getSetting('advance_notice_days', '3'));

    // Check if advance notice requirement is met
    const today = new Date();
    const daysUntilLeave = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

    if (daysUntilLeave < advanceNoticeDays) {
      return res.status(400).json({
        success: false,
        message: `Leave request must be submitted at least ${advanceNoticeDays} days in advance`,
      });
    }

    const result = await query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employee_id, leave_type, start_date, end_date, daysCount, reason]
    );

    // Emit real-time notification to admins
    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('notification', {
        type: 'LEAVE_APPLICATION',
        message: `New leave request from employee ID ${employee_id}`,
        data: result.rows[0]
      });
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'LEAVE' });
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request',
      error: error.message,
    });
  }
};

// Update leave request
const updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { leave_type, start_date, end_date, reason } = req.body;

    // Calculate days count
    const start = new Date(start_date);
    const end = new Date(end_date);
    const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const result = await query(
      `UPDATE leave_requests 
       SET leave_type = $1, start_date = $2, end_date = $3, days_count = $4, reason = $5, updated_at = CURRENT_TIMESTAMP
       WHERE leave_id = $6 AND status = 'pending'
       RETURNING *`,
      [leave_type, start_date, end_date, daysCount, reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or already processed',
      });
    }

    res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request',
      error: error.message,
    });
  }
};

// Approve leave request
const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user.userId;

    const result = await query(
      `UPDATE leave_requests 
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE leave_id = $2 AND status = 'pending'
       RETURNING *`,
      [approvedBy, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or already processed',
      });
    }

    res.json({
      success: true,
      message: 'Leave request approved successfully',
      data: result.rows[0],
    });

    // Notify employee and update dashboard
    if (req.io && req.tenant) {
      // Ideally we would emit to specific user room, but for now broadcast to tenant to force update
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'LEAVE' });
    }
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave request',
      error: error.message,
    });
  }
};

// Reject leave request
const rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const approvedBy = req.user.userId;

    const result = await query(
      `UPDATE leave_requests 
       SET status = 'rejected', approved_by = $1, approved_at = CURRENT_TIMESTAMP, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE leave_id = $3 AND status = 'pending'
       RETURNING *`,
      [approvedBy, rejection_reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or already processed',
      });
    }

    res.json({
      success: true,
      message: 'Leave request rejected',
      data: result.rows[0],
    });

    // Notify employee and update dashboard
    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'LEAVE' });
    }
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave request',
      error: error.message,
    });
  }
};

// Delete leave request
const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM leave_requests WHERE leave_id = $1 AND status = \'pending\' RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or already processed',
      });
    }

    res.json({
      success: true,
      message: 'Leave request deleted successfully',
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'LEAVE' });
    }
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave request',
      error: error.message,
    });
  }
};

// Get leave balance for an employee
const getLeaveBalance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Validate employee access
    if (userRole === 'employee') {
      // Employees can only view their own leave balance
      const employeeResult = await query(
        'SELECT employee_id FROM employees WHERE user_id = $1',
        [userId]
      );

      if (employeeResult.rows.length === 0 || employeeResult.rows[0].employee_id != employee_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own leave balance.',
        });
      }
    }

    // Get employee details
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
        message: 'Employee not found',
      });
    }

    const employee = employeeResult.rows[0];

    // Get leave settings
    const leaveTypesSetting = await getSetting('leave_types', '["Sick Leave", "Casual Leave", "Vacation"]');
    const leaveTypes = JSON.parse(leaveTypesSetting);

    // Get default leave allocations from settings
    const defaultAllocations = {
      'Sick Leave': parseInt(await getSetting('sick_leave_days', '10')),
      'Casual Leave': parseInt(await getSetting('casual_leave_days', '12')),
      'Vacation': parseInt(await getSetting('annual_leave_days', '20')),
      'Maternity Leave': 90, // Standard maternity leave
      'Paternity Leave': 10, // Standard paternity leave
      'Bereavement Leave': 3, // Standard bereavement leave
      'Unpaid Leave': 0, // No allocation for unpaid leave
      'Comp-Off': 0 // Init as 0, will be summed from approved requests
    };

    // Calculate used leaves for each type
    const leaveBalance = {};

    for (const leaveType of leaveTypes) {
      // Get total allocated leaves for this type
      let allocated = defaultAllocations[leaveType] || 0;

      // If Comp-Off, calculate allocated dynamically from approved requests
      if (leaveType === 'Comp-Off') {
        const compOffResult = await query(
          `SELECT COUNT(*) as count FROM leave_comp_off_requests 
              WHERE employee_id = $1 AND status = 'approved' AND expiry_date >= CURRENT_DATE`,
          [employee_id]
        );
        // Assuming 1 approved request = 1 day of leave
        allocated = parseInt(compOffResult.rows[0].count) || 0;
      }

      // Get approved leaves for this type
      const usedResult = await query(
        `SELECT COALESCE(SUM(days_count), 0) as total_used 
         FROM leave_requests 
         WHERE employee_id = $1 AND leave_type = $2 AND status = 'approved'`,
        [employee_id, leaveType]
      );

      const used = parseInt(usedResult.rows[0].total_used) || 0;
      const remaining = allocated - used;

      leaveBalance[leaveType] = {
        allocated,
        used,
        remaining: Math.max(0, remaining) // Ensure non-negative
      };
    }

    // Calculate total across all leave types
    const totalAllocated = Object.values(leaveBalance).reduce((sum, type) => sum + type.allocated, 0);
    const totalUsed = Object.values(leaveBalance).reduce((sum, type) => sum + type.used, 0);
    const totalRemaining = Object.values(leaveBalance).reduce((sum, type) => sum + type.remaining, 0);

    res.json({
      success: true,
      data: {
        employee: {
          employee_id: employee.employee_id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          department: employee.department_name,
          position: employee.position
        },
        leaveBalance,
        summary: {
          totalAllocated,
          totalUsed,
          totalRemaining
        }
      }
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: error.message,
    });
  }
};

// Get leave balance summary for all employees (admin/manager only)
const getAllLeaveBalances = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only admins and managers can view all leave balances
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and managers can view all leave balances.',
      });
    }

    // Get all active employees
    const employeesResult = await query(
      `SELECT e.employee_id, e.first_name, e.last_name, d.department_name, e.position
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       WHERE e.status = 'active'
       ORDER BY e.first_name, e.last_name`
    );

    // Get leave settings
    const leaveTypesSetting = await getSetting('leave_types', '["Sick Leave", "Casual Leave", "Vacation"]');
    const leaveTypes = JSON.parse(leaveTypesSetting);

    const defaultAllocations = {
      'Sick Leave': parseInt(await getSetting('sick_leave_days', '10')),
      'Casual Leave': parseInt(await getSetting('casual_leave_days', '12')),
      'Vacation': parseInt(await getSetting('annual_leave_days', '20')),
      'Maternity Leave': 90,
      'Paternity Leave': 10,
      'Bereavement Leave': 3,
      'Unpaid Leave': 0
    };

    const allLeaveBalances = [];

    // Calculate leave balance for each employee
    for (const employee of employeesResult.rows) {
      const leaveBalance = {};

      for (const leaveType of leaveTypes) {
        const allocated = defaultAllocations[leaveType] || 0;

        const usedResult = await query(
          `SELECT COALESCE(SUM(days_count), 0) as total_used 
           FROM leave_requests 
           WHERE employee_id = $1 AND leave_type = $2 AND status = 'approved'`,
          [employee.employee_id, leaveType]
        );

        const used = parseInt(usedResult.rows[0].total_used) || 0;
        const remaining = allocated - used;

        leaveBalance[leaveType] = {
          allocated,
          used,
          remaining: Math.max(0, remaining)
        };
      }

      const totalAllocated = Object.values(leaveBalance).reduce((sum, type) => sum + type.allocated, 0);
      const totalUsed = Object.values(leaveBalance).reduce((sum, type) => sum + type.used, 0);
      const totalRemaining = Object.values(leaveBalance).reduce((sum, type) => sum + type.remaining, 0);

      allLeaveBalances.push({
        employee: {
          employee_id: employee.employee_id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          department: employee.department_name,
          position: employee.position
        },
        leaveBalance,
        summary: {
          totalAllocated,
          totalUsed,
          totalRemaining
        }
      });
    }

    res.json({
      success: true,
      data: allLeaveBalances,
      count: allLeaveBalances.length
    });
  } catch (error) {
    console.error('Get all leave balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balances',
      error: error.message,
    });
  }
};

// Get leave statistics
const getLeaveStatistics = async (req, res) => {
  try {
    const { employee_id, status, start_date, end_date } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let queryText = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected_requests
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Role-based filtering: employees can only see their own leave requests
    if (userRole === 'employee') {
      queryText += ` AND e.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (employee_id) {
      queryText += ` AND lr.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND lr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      queryText += ` AND lr.start_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      queryText += ` AND lr.end_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get leave statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error.message,
    });
  }
};

// Request Comp-off
const requestCompOff = async (req, res) => {
  try {
    const { employee_id, worked_date, reason } = req.body;

    // Check if a request already exists/pending for this date
    const existing = await query(
      'SELECT * FROM leave_comp_off_requests WHERE employee_id = $1 AND worked_date = $2 AND status = \'pending\'',
      [employee_id, worked_date]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A pending requests already exists for this date.' });
    }

    // Default expiry date logic (e.g., 60 days from worked date)
    const workedDateObj = new Date(worked_date);
    const expiryDate = new Date(workedDateObj.setDate(workedDateObj.getDate() + 60)).toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO leave_comp_off_requests 
            (employee_id, worked_date, reason, expiry_date)
            VALUES ($1, $2, $3, $4) RETURNING *`,
      [employee_id, worked_date, reason, expiryDate]
    );

    res.status(201).json({ success: true, message: 'Comp-off requested successfully', data: result.rows[0] });

  } catch (error) {
    console.error('Request comp-off error:', error);
    res.status(500).json({ success: false, message: 'Failed to request comp-off', error: error.message });
  }
};

// Approve/Reject Comp-off
const updateCompOffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const approved_by = req.user.userId;

    const result = await query(
      `UPDATE leave_comp_off_requests 
            SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP 
            WHERE request_id = $3 RETURNING *`,
      [status, approved_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: `Request ${status} successfully`, data: result.rows[0] });

  } catch (error) {
    console.error('Update comp-off error:', error);
    res.status(500).json({ success: false, message: 'Failed to update request', error: error.message });
  }
};

// Get Comp-off Requests
const getCompOffRequests = async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    let queryText = `
            SELECT r.*, e.first_name || ' ' || e.last_name as employee_name 
            FROM leave_comp_off_requests r
            JOIN employees e ON r.employee_id = e.employee_id
            WHERE 1=1
        `;
    const params = [];
    let paramIndex = 1;

    if (employee_id) {
      queryText += ` AND r.employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    if (status) {
      queryText += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ' ORDER BY r.created_at DESC';

    const result = await query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get comp-off requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

module.exports = {
  getLeaveRequestById,
  getAllLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
  getLeaveBalance,
  getAllLeaveBalances,
  getLeaveStatistics,
  requestCompOff,
  updateCompOffStatus,
  getCompOffRequests
};