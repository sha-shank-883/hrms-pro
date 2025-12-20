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

// Get all attendance records with pagination
const getAllAttendance = async (req, res) => {
  try {
    const { employee_id, start_date, end_date, status, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT a.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             e.employee_id,
             d.department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE 1=1
    `;
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering: employees can only see their own attendance
    if (userRole === 'employee') {
      queryText += ` AND e.user_id = $${paramCount}`;
      countQueryText += ` AND e.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (employee_id) {
      queryText += ` AND a.employee_id = $${paramCount}`;
      countQueryText += ` AND a.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (start_date) {
      queryText += ` AND a.date >= $${paramCount}`;
      countQueryText += ` AND a.date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      queryText += ` AND a.date <= $${paramCount}`;
      countQueryText += ` AND a.date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (status) {
      queryText += ` AND a.status = $${paramCount}`;
      countQueryText += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ' ORDER BY a.date DESC, a.created_at DESC';

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
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message,
    });
  }
};

// Clock in
const clockIn = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    // Check if already clocked in today
    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employee_id, today]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today',
      });
    }

    const result = await query(
      `INSERT INTO attendance (employee_id, date, clock_in, status)
       VALUES ($1, $2, $3, 'present')
       RETURNING *`,
      [employee_id, today, currentTime]
    );

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('notification', {
        type: 'ATTENDANCE_LOG',
        message: `Employee ${employee_id} clocked in`,
        data: result.rows[0]
      });
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'ATTENDANCE' });
    }
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in',
      error: error.message,
    });
  }
};

// Clock out
const clockOut = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employee_id, today]
    );

    if (existing.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No clock-in record found for today',
      });
    }

    if (existing.rows[0].clock_out) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today',
      });
    }

    // Calculate work hours
    const clockIn = existing.rows[0].clock_in;
    const clockInTime = new Date(`1970-01-01T${clockIn}Z`);
    const clockOutTime = new Date(`1970-01-01T${currentTime}Z`);
    const workHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2);

    // Check if overtime based on settings
    const standardWorkHours = parseFloat(await getSetting('working_hours', '8'));
    const overtimeEnabled = await getSetting('overtime_enabled', 'false');

    let overtimeHours = 0;
    if (overtimeEnabled === 'true' && parseFloat(workHours) > standardWorkHours) {
      overtimeHours = (parseFloat(workHours) - standardWorkHours).toFixed(2);
    }

    const result = await query(
      `UPDATE attendance 
       SET clock_out = $1, work_hours = $2, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $3 AND date = $4
       RETURNING *`,
      [currentTime, workHours, employee_id, today]
    );

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('notification', {
        type: 'ATTENDANCE_LOG',
        message: `Employee ${employee_id} clocked out`,
        data: result.rows[0]
      });
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'ATTENDANCE' });
    }
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out',
      error: error.message,
    });
  }
};

// Create manual attendance
const createAttendance = async (req, res) => {
  try {
    const { employee_id, date, clock_in, clock_out, status, notes } = req.body;

    // Calculate work hours if both times provided
    let workHours = null;
    if (clock_in && clock_out) {
      const clockInTime = new Date(`1970-01-01T${clock_in}Z`);
      const clockOutTime = new Date(`1970-01-01T${clock_out}Z`);
      workHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2);
    }

    const result = await query(
      `INSERT INTO attendance (employee_id, date, clock_in, clock_out, status, work_hours, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [employee_id, date, clock_in || null, clock_out || null, status, workHours, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'ATTENDANCE' });
    }
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance record',
      error: error.message,
    });
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { clock_in, clock_out, status, notes } = req.body;

    // Calculate work hours if both times provided
    let workHours = null;
    if (clock_in && clock_out) {
      const clockInTime = new Date(`1970-01-01T${clock_in}Z`);
      const clockOutTime = new Date(`1970-01-01T${clock_out}Z`);
      workHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2);
    }

    const result = await query(
      `UPDATE attendance 
       SET clock_in = $1, clock_out = $2, status = $3, work_hours = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
       WHERE attendance_id = $6
       RETURNING *`,
      [clock_in || null, clock_out || null, status, workHours, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: result.rows[0],
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'ATTENDANCE' });
    }
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message,
    });
  }
};

// Delete attendance
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM attendance WHERE attendance_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });

    if (req.io && req.tenant) {
      req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'ATTENDANCE' });
    }
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message,
    });
  }
};

// Regularization Request
const requestRegularization = async (req, res) => {
  try {
    const { employee_id, date, requested_clock_in, requested_clock_out, reason } = req.body;

    // Check if a request already exists/pending for this date
    const existing = await query(
      'SELECT * FROM attendance_regularization WHERE employee_id = $1 AND date = $2 AND status = \'pending\'',
      [employee_id, date]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A pending request already exists for this date.' });
    }

    // Get original attendance if exists
    const attendance = await query('SELECT clock_in, clock_out FROM attendance WHERE employee_id = $1 AND date = $2', [employee_id, date]);
    const original_clock_in = attendance.rows.length > 0 ? attendance.rows[0].clock_in : null;
    const original_clock_out = attendance.rows.length > 0 ? attendance.rows[0].clock_out : null;

    const result = await query(
      `INSERT INTO attendance_regularization 
            (employee_id, date, original_clock_in, original_clock_out, requested_clock_in, requested_clock_out, reason)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employee_id, date, original_clock_in, original_clock_out, requested_clock_in, requested_clock_out, reason]
    );

    res.status(201).json({ success: true, message: 'Regularization requested successfully', data: result.rows[0] });

  } catch (error) {
    console.error('Request regularization error:', error);
    res.status(500).json({ success: false, message: 'Failed to request regularization', error: error.message });
  }
};

// Approve/Reject Regularization
const updateRegularizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const approved_by = req.user.userId; // Assuming middleware adds user info

    const result = await query(
      `UPDATE attendance_regularization 
            SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP 
            WHERE regularization_id = $3 RETURNING *`,
      [status, approved_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = result.rows[0];

    // If approved, update the main attendance table
    if (status === 'approved') {
      // Check if attendance record exists, if not create one
      const attendance = await query('SELECT * FROM attendance WHERE employee_id = $1 AND date = $2', [request.employee_id, request.date]);

      // Calculate work hours
      const clockInTime = new Date(`1970-01-01T${request.requested_clock_in}Z`);
      const clockOutTime = new Date(`1970-01-01T${request.requested_clock_out}Z`);
      const workHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2);

      if (attendance.rows.length > 0) {
        await query(
          `UPDATE attendance SET clock_in = $1, clock_out = $2, work_hours = $3, status = 'present', notes = 'Regularized' 
                     WHERE employee_id = $4 AND date = $5`,
          [request.requested_clock_in, request.requested_clock_out, workHours, request.employee_id, request.date]
        );
      } else {
        await query(
          `INSERT INTO attendance (employee_id, date, clock_in, clock_out, work_hours, status, notes)
                     VALUES ($1, $2, $3, $4, $5, 'present', 'Regularized')`,
          [request.employee_id, request.date, request.requested_clock_in, request.requested_clock_out, workHours]
        );
      }
    }

    res.json({ success: true, message: `Request ${status} successfully`, data: request });

  } catch (error) {
    console.error('Update regularization error:', error);
    res.status(500).json({ success: false, message: 'Failed to update request', error: error.message });
  }
};

// Get Regularization Requests
const getRegularizationRequests = async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    let queryText = `
            SELECT r.*, e.first_name || ' ' || e.last_name as employee_name 
            FROM attendance_regularization r
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
    console.error('Get regularization requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

module.exports = {
  getAllAttendance,
  clockIn,
  clockOut,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  requestRegularization,
  updateRegularizationStatus,
  getRegularizationRequests
};
