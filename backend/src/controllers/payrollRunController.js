const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

const VALID_STATUSES = ['draft', 'finalized', 'paid', 'archived'];

const getAllRuns = asyncHandler(async (req, res) => {
  const { status, year, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  let sql = 'SELECT * FROM payroll_runs WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM payroll_runs WHERE 1=1';
  const params = [];
  let paramIdx = 1;

  if (status) {
    sql += ` AND status = $${paramIdx}`;
    countSql += ` AND status = $${paramIdx}`;
    params.push(status);
    paramIdx++;
  }
  if (year) {
    sql += ` AND period_year = $${paramIdx}`;
    countSql += ` AND period_year = $${paramIdx}`;
    params.push(parseInt(year));
    paramIdx++;
  }

  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].total);

  sql += ' ORDER BY period_year DESC, period_month DESC';
  sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  params.push(limitNum, offset);

  const result = await query(sql, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

const getRunById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const runResult = await query('SELECT * FROM payroll_runs WHERE run_id = $1', [id]);
  if (runResult.rows.length === 0) throw new NotFoundError('Payroll run not found');

  const payslipsResult = await query(
    `SELECT ps.*, e.first_name || ' ' || e.last_name as employee_name, e.department_id, d.department_name
     FROM payslips ps
     JOIN employees e ON ps.employee_id = e.employee_id
     LEFT JOIN departments d ON e.department_id = d.department_id
     WHERE ps.run_id = $1
     ORDER BY e.first_name`,
    [id]
  );

  res.json({
    success: true,
    data: {
      run: runResult.rows[0],
      payslips: payslipsResult.rows,
      summary: {
        total: payslipsResult.rows.length,
        paid: payslipsResult.rows.filter(p => p.payment_status === 'paid').length,
        pending: payslipsResult.rows.filter(p => p.payment_status === 'pending').length,
      },
    },
  });
});

const createRun = asyncHandler(async (req, res) => {
  const { period_month, period_year, notes } = req.body;

  if (!period_month || !period_year) {
    throw new ValidationError('Period month and year are required');
  }
  if (period_month < 1 || period_month > 12) {
    throw new ValidationError('Month must be between 1 and 12');
  }

  const existing = await query(
    'SELECT * FROM payroll_runs WHERE period_month = $1 AND period_year = $2',
    [period_month, period_year]
  );
  if (existing.rows.length > 0) {
    throw new ConflictError('A payroll run already exists for this period');
  }

  const result = await query(
    `INSERT INTO payroll_runs (period_month, period_year, status, generated_by, notes)
     VALUES ($1, $2, 'draft', $3, $4) RETURNING *`,
    [period_month, period_year, req.user.userId, notes || null]
  );

  res.status(201).json({ success: true, message: 'Payroll run created', data: result.rows[0] });
});

const finalizeRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await query('SELECT * FROM payroll_runs WHERE run_id = $1', [id]);
  if (run.rows.length === 0) throw new NotFoundError('Payroll run not found');
  if (run.rows[0].status !== 'draft') {
    throw new ValidationError(`Cannot finalize a run with status '${run.rows[0].status}'. Only draft runs can be finalized.`);
  }

  await query(
    `UPDATE payroll_runs SET total_employees = (SELECT COUNT(*) FROM payslips WHERE run_id = $1),
     total_gross = (SELECT COALESCE(SUM(gross_pay), 0) FROM payslips WHERE run_id = $1),
     total_deductions = (SELECT COALESCE(SUM(total_deductions), 0) FROM payslips WHERE run_id = $1),
     total_net = (SELECT COALESCE(SUM(net_pay), 0) FROM payslips WHERE run_id = $1),
     updated_at = CURRENT_TIMESTAMP WHERE run_id = $1`,
    [id]
  );

  const result = await query(
    `UPDATE payroll_runs SET status = 'finalized', finalized_at = CURRENT_TIMESTAMP,
     updated_at = CURRENT_TIMESTAMP WHERE run_id = $1 RETURNING *`,
    [id]
  );

  res.json({ success: true, message: 'Payroll run finalized', data: result.rows[0] });
});

const payRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { payment_method, payment_date } = req.body || {};

  const run = await query('SELECT * FROM payroll_runs WHERE run_id = $1', [id]);
  if (run.rows.length === 0) throw new NotFoundError('Payroll run not found');
  if (run.rows[0].status !== 'finalized') {
    throw new ValidationError(`Cannot process payment. Run must be finalized first (current: '${run.rows[0].status}')`);
  }

  const method = payment_method || 'bank_transfer';
  const date = payment_date || new Date().toISOString().split('T')[0];

  const result = await query(
    `UPDATE payroll_runs SET status = 'paid', paid_at = CURRENT_TIMESTAMP,
     updated_at = CURRENT_TIMESTAMP WHERE run_id = $1 RETURNING *`,
    [id]
  );

  await query(
    `UPDATE payslips SET payment_status = 'paid', payment_date = $1,
     payment_method = $2, updated_at = CURRENT_TIMESTAMP WHERE run_id = $3`,
    [date, method, id]
  );

  res.json({ success: true, message: 'Payroll run marked as paid. All payslips updated.', data: result.rows[0] });
});

const archiveRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await query('SELECT * FROM payroll_runs WHERE run_id = $1', [id]);
  if (run.rows.length === 0) throw new NotFoundError('Payroll run not found');
  if (!['finalized', 'paid'].includes(run.rows[0].status)) {
    throw new ValidationError('Only finalized or paid runs can be archived');
  }

  const result = await query(
    `UPDATE payroll_runs SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE run_id = $1 RETURNING *`,
    [id]
  );

  res.json({ success: true, message: 'Payroll run archived', data: result.rows[0] });
});

const deleteRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await query('SELECT * FROM payroll_runs WHERE run_id = $1', [id]);
  if (run.rows.length === 0) throw new NotFoundError('Payroll run not found');
  if (run.rows[0].status !== 'draft') {
    throw new ValidationError('Only draft runs can be deleted');
  }

  await query('DELETE FROM payroll_runs WHERE run_id = $1', [id]);
  res.json({ success: true, message: 'Payroll run deleted' });
});

module.exports = {
  getAllRuns,
  getRunById,
  createRun,
  finalizeRun,
  payRun,
  archiveRun,
  deleteRun,
};
