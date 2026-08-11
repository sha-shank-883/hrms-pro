const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const getAllHolidays = asyncHandler(async (req, res) => {
  const { year } = req.query;
  let queryText = 'SELECT * FROM holidays';
  const params = [];

  if (year) {
    queryText += ' WHERE EXTRACT(YEAR FROM date) = $1';
    params.push(year);
  }

  queryText += ' ORDER BY date ASC';

  const result = await query(queryText, params);
  res.json({ success: true, data: result.rows });
});

const getEmployeeRestrictedHolidays = asyncHandler(async (req, res) => {
  const { employee_id, year } = req.query;

  const result = await query(
    `SELECT rh.*, h.name, h.date, h.description 
     FROM employee_restricted_holidays rh
     JOIN holidays h ON rh.holiday_id = h.holiday_id
     WHERE rh.employee_id = $1 AND rh.year = $2`,
    [employee_id, year || new Date().getFullYear()]
  );

  res.json({ success: true, data: result.rows });
});

const optInRestrictedHoliday = asyncHandler(async (req, res) => {
  const { employee_id, holiday_id } = req.body;
  const year = new Date().getFullYear();

  // Check if already opted
  const existing = await query(
    'SELECT * FROM employee_restricted_holidays WHERE employee_id = $1 AND holiday_id = $2',
    [employee_id, holiday_id]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('Already opted for this holiday');
  }

  // Check quota (e.g., max 2 per year) - mock limit 2
  const countResult = await query(
    'SELECT COUNT(*) as count FROM employee_restricted_holidays WHERE employee_id = $1 AND year = $2',
    [employee_id, year]
  );

  if (parseInt(countResult.rows[0].count) >= 2) {
    throw new ValidationError('Restricted Holiday quota (2) exceeded for this year');
  }

  const result = await query(
    'INSERT INTO employee_restricted_holidays (employee_id, holiday_id, year, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [employee_id, holiday_id, year, 'approved']
  );

  res.status(201).json({ success: true, message: 'Opted for Restricted Holiday successfully', data: result.rows[0] });
});

const createHoliday = asyncHandler(async (req, res) => {
  const name = req.body.name || req.body.holiday_name;
  const date = req.body.date || req.body.holiday_date;
  const { description, type } = req.body;
  if (!name || !date) {
    throw new ValidationError('Holiday name and date are required');
  }
  if (isNaN(Date.parse(date))) {
    throw new ValidationError('Valid holiday date is required (e.g. YYYY-MM-DD)');
  }
  const result = await query(
    `INSERT INTO holidays (name, date, description, type) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, date, description || null, type || 'mandatory']
  );
  res.status(201).json({ success: true, message: 'Holiday created', data: result.rows[0] });
});

const updateHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    throw new ValidationError('Invalid holiday ID');
  }
  const name = req.body.name || req.body.holiday_name;
  const date = req.body.date || req.body.holiday_date;
  const { description, type } = req.body;
  const result = await query(
    `UPDATE holidays SET name = COALESCE($1, name), date = COALESCE($2, date), description = COALESCE($3, description), type = COALESCE($4, type) WHERE holiday_id = $5 RETURNING *`,
    [name, date, description, type, id]
  );
  if (result.rows.length === 0) {
    throw new NotFoundError('Holiday not found');
  }
  res.json({ success: true, message: 'Holiday updated', data: result.rows[0] });
});

const deleteHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    throw new ValidationError('Invalid holiday ID');
  }
  const result = await query('DELETE FROM holidays WHERE holiday_id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Holiday not found');
  }
  res.json({ success: true, message: 'Holiday deleted' });
});

module.exports = {
  getAllHolidays,
  getEmployeeRestrictedHolidays,
  optInRestrictedHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
