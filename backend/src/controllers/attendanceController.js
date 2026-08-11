const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

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

// Haversine formula to calculate distance in meters
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


// Get all attendance records with pagination
const getAllAttendance = asyncHandler(async (req, res) => {
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
});

// Get today's attendance for an employee
const checkToday = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0];

  const result = await query(
    `SELECT a.* FROM attendance a
     JOIN employees e ON a.employee_id = e.employee_id
     WHERE e.user_id = $1 AND a.date = $2`,
    [userId, today]
  );

  res.json({
    success: true,
    data: result.rows.length > 0 ? result.rows[0] : null
  });
});

// Get attendance history for current user
const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;
  
  let queryText = `
    SELECT a.* FROM attendance a
    JOIN employees e ON a.employee_id = e.employee_id
    WHERE e.user_id = $1
  `;
  const params = [userId];

  if (month && year) {
    queryText += ` AND EXTRACT(MONTH FROM a.date) = $2 AND EXTRACT(YEAR FROM a.date) = $3`;
    params.push(month, year);
  }

  queryText += ' ORDER BY a.date DESC';

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows
  });
});

// Clock in
const clockIn = asyncHandler(async (req, res) => {
  let { employee_id, latitude, longitude } = req.body;
  const userId = req.user.userId;

  // Resolve employee_id from userId if not provided
  if (!employee_id) {
    const empResult = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
    if (empResult.rows.length === 0) {
      throw new ForbiddenError('Employee profile not found');
    }
    employee_id = empResult.rows[0].employee_id;
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  // Check if already clocked in today
  const existing = await query(
    'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
    [employee_id, today]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('Already clocked in today');
  }

  let locationStatus = 'unknown';
  if (latitude && longitude) {
    const officeLat = await getSetting('office_latitude', '0');
    const officeLon = await getSetting('office_longitude', '0');
    const geofenceRadius = parseFloat(await getSetting('geofence_radius', '500'));
    const isStrict = await getSetting('strict_geofence', 'false') === 'true';

    if (officeLat !== '0' && officeLon !== '0') {
      const distance = getDistanceInMeters(latitude, longitude, parseFloat(officeLat), parseFloat(officeLon));
      if (distance !== null) {
        if (distance <= geofenceRadius) {
          locationStatus = 'inside';
        } else {
          locationStatus = 'outside';
          if (isStrict) {
            throw new ForbiddenError('Clock-in blocked: You are outside the designated office geofence.');
          }
        }
      }
    }
  }

  let status = 'present';
  const gracePeriod = parseInt(await getSetting('grace_period', '15'));
  
  // Check for assigned shift today
  const shiftResult = await query(
    `SELECT s.start_time 
     FROM employee_shifts es
     JOIN shifts s ON es.shift_id = s.shift_id
     WHERE es.employee_id = $1 
     AND $2 BETWEEN es.start_date AND COALESCE(es.end_date, '9999-12-31')
     LIMIT 1`,
    [employee_id, today]
  );

  if (shiftResult.rows.length > 0) {
    const shiftStart = shiftResult.rows[0].start_time; // format HH:MM:SS
    const [sHours, sMinutes] = shiftStart.split(':').map(Number);
    const [cHours, cMinutes] = currentTime.split(':').map(Number);
    
    const shiftStartTotalMinutes = sHours * 60 + sMinutes;
    const currentTotalMinutes = cHours * 60 + cMinutes;
    
    if (currentTotalMinutes > (shiftStartTotalMinutes + gracePeriod)) {
      status = 'late';
    }
  }

  const result = await query(
    `INSERT INTO attendance (employee_id, date, clock_in, status, check_in_latitude, check_in_longitude, location_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [employee_id, today, currentTime, status, latitude || null, longitude || null, locationStatus]
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
});

// Clock out
const clockOut = asyncHandler(async (req, res) => {
  let { employee_id, latitude, longitude } = req.body;
  const userId = req.user.userId;

  // Resolve employee_id from userId if not provided
  if (!employee_id) {
    const empResult = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
    if (empResult.rows.length === 0) {
      throw new ForbiddenError('Employee profile not found');
    }
    employee_id = empResult.rows[0].employee_id;
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  const existing = await query(
    'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
    [employee_id, today]
  );

  if (existing.rows.length === 0) {
    throw new ValidationError('No clock-in record found for today');
  }

  if (existing.rows[0].clock_out) {
    throw new ConflictError('Already clocked out today');
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

  let locationStatus = existing.rows[0].location_status || 'unknown';
  if (latitude && longitude) {
    const officeLat = await getSetting('office_latitude', '0');
    const officeLon = await getSetting('office_longitude', '0');
    const geofenceRadius = parseFloat(await getSetting('geofence_radius', '500'));
    const isStrict = await getSetting('strict_geofence', 'false') === 'true';

    if (officeLat !== '0' && officeLon !== '0') {
      const distance = getDistanceInMeters(latitude, longitude, parseFloat(officeLat), parseFloat(officeLon));
      if (distance !== null) {
        if (distance > geofenceRadius) {
          locationStatus = 'outside';
          if (isStrict) {
            throw new ForbiddenError('Clock-out blocked: You are outside the designated office geofence.');
          }
        }
      }
    }
  }

  const result = await query(
    `UPDATE attendance 
     SET clock_out = $1, work_hours = $2, check_out_latitude = $3, check_out_longitude = $4, location_status = $5, updated_at = CURRENT_TIMESTAMP
     WHERE employee_id = $6 AND date = $7
     RETURNING *`,
    [currentTime, workHours, latitude || null, longitude || null, locationStatus, employee_id, today]
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
});

// Create manual attendance
const createAttendance = asyncHandler(async (req, res) => {
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
});

// Update attendance
const updateAttendance = asyncHandler(async (req, res) => {
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
    throw new NotFoundError('Attendance record not found');
  }

  res.json({
    success: true,
    message: 'Attendance record updated successfully',
    data: result.rows[0],
  });

  if (req.io && req.tenant) {
    req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'ATTENDANCE' });
  }
});

// Delete attendance
const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM attendance WHERE attendance_id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Attendance record not found');
  }

  res.json({
    success: true,
    message: 'Attendance record deleted successfully',
  });

  if (req.io && req.tenant) {
    req.io.to(req.tenant.tenant_id).emit('dashboard_update', { type: 'ATTENDANCE' });
  }
});

// Regularization Request
const requestRegularization = asyncHandler(async (req, res) => {
  const { employee_id, date, requested_clock_in, requested_clock_out, reason } = req.body;

  // Check if a request already exists/pending for this date
  const existing = await query(
    'SELECT * FROM attendance_regularization WHERE employee_id = $1 AND date = $2 AND status = \'pending\'',
    [employee_id, date]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('A pending request already exists for this date.');
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
});

// Approve/Reject Regularization
const updateRegularizationStatus = asyncHandler(async (req, res) => {
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
    throw new NotFoundError('Request not found');
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
});

// Get Regularization Requests
const getRegularizationRequests = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getAllAttendance,
  checkToday,
  getHistory,
  clockIn,
  clockOut,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  requestRegularization,
  updateRegularizationStatus,
  getRegularizationRequests
};
