const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const getShifts = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM shifts ORDER BY start_time ASC');
  res.json({ success: true, data: result.rows });
});

const createShift = asyncHandler(async (req, res) => {
  const { shift_name, start_time, end_time } = req.body;
  if (!shift_name) {
    throw new ValidationError('Shift name is required');
  }
  if (!start_time) {
    throw new ValidationError('Start time is required');
  }
  if (!end_time) {
    throw new ValidationError('End time is required');
  }
  const result = await query(
    'INSERT INTO shifts (shift_name, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
    [shift_name, start_time, end_time]
  );
  res.status(201).json({ success: true, message: 'Shift created successfully', data: result.rows[0] });
});

const updateShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { shift_name, start_time, end_time } = req.body;
  const result = await query(
    'UPDATE shifts SET shift_name = $1, start_time = $2, end_time = $3 WHERE shift_id = $4 RETURNING *',
    [shift_name, start_time, end_time, id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Shift not found');
  res.json({ success: true, message: 'Shift updated successfully', data: result.rows[0] });
});

const deleteShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('DELETE FROM shifts WHERE shift_id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Shift not found');
  res.json({ success: true, message: 'Shift deleted successfully' });
});

const getAssignments = asyncHandler(async (req, res) => {
  const { employee_id, start_date, end_date } = req.query;
  let queryText = `
    SELECT es.*, s.shift_name, s.start_time, s.end_time, e.first_name || ' ' || e.last_name as employee_name
    FROM employee_shifts es
    JOIN shifts s ON es.shift_id = s.shift_id
    JOIN employees e ON es.employee_id = e.employee_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (employee_id) {
    queryText += ` AND es.employee_id = $${paramIndex++}`;
    params.push(employee_id);
  }
  if (start_date) {
    queryText += ` AND es.start_date >= $${paramIndex++}`;
    params.push(start_date);
  }
  if (end_date) {
    queryText += ` AND (es.end_date <= $${paramIndex++} OR es.end_date IS NULL)`;
    params.push(end_date);
  }

  queryText += ' ORDER BY es.start_date DESC';
  const result = await query(queryText, params);
  res.json({ success: true, data: result.rows });
});

const assignShift = asyncHandler(async (req, res) => {
  const { employee_id, shift_id, start_date, end_date } = req.body;
  if (!employee_id) {
    throw new ValidationError('Employee ID is required');
  }
  if (!shift_id) {
    throw new ValidationError('Shift ID is required');
  }
  const assigned_by = req.user.userId;

  const result = await query(
    `INSERT INTO employee_shifts (employee_id, shift_id, start_date, end_date, assigned_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [employee_id, shift_id, start_date, end_date || null, assigned_by]
  );
  res.status(201).json({ success: true, message: 'Shift assigned successfully', data: result.rows[0] });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('DELETE FROM employee_shifts WHERE assignment_id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Assignment not found');
  res.json({ success: true, message: 'Assignment deleted successfully' });
});

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getAssignments,
  assignShift,
  deleteAssignment
};
