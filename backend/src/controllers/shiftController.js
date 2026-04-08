const { query } = require('../config/database');

const getShifts = async (req, res) => {
  try {
    const result = await query('SELECT * FROM shifts ORDER BY start_time ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shifts', error: error.message });
  }
};

const createShift = async (req, res) => {
  try {
    const { shift_name, start_time, end_time } = req.body;
    const result = await query(
      'INSERT INTO shifts (shift_name, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
      [shift_name, start_time, end_time]
    );
    res.status(201).json({ success: true, message: 'Shift created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to create shift', error: error.message });
  }
};

const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift_name, start_time, end_time } = req.body;
    const result = await query(
      'UPDATE shifts SET shift_name = $1, start_time = $2, end_time = $3 WHERE shift_id = $4 RETURNING *',
      [shift_name, start_time, end_time, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Shift not found' });
    res.json({ success: true, message: 'Shift updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to update shift', error: error.message });
  }
};

const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM shifts WHERE shift_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Shift not found' });
    res.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete shift', error: error.message });
  }
};

const getAssignments = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }
};

const assignShift = async (req, res) => {
  try {
    const { employee_id, shift_id, start_date, end_date } = req.body;
    const assigned_by = req.user.userId;

    const result = await query(
      `INSERT INTO employee_shifts (employee_id, shift_id, start_date, end_date, assigned_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employee_id, shift_id, start_date, end_date || null, assigned_by]
    );
    res.status(201).json({ success: true, message: 'Shift assigned successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Assign shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign shift', error: error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM employee_shifts WHERE assignment_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete assignment', error: error.message });
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getAssignments,
  assignShift,
  deleteAssignment
};
