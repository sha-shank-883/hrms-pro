const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
const emailQueueService = require('../services/emailQueueService');

const listQueue = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;
  const params = [];
  let paramIdx = 1;

  let sql = `SELECT eq.*, e.first_name || ' ' || e.last_name as employee_name, ps.employee_id
    FROM email_queue eq
    JOIN payslips ps ON eq.payslip_id = ps.payslip_id
    JOIN employees e ON ps.employee_id = e.employee_id
    WHERE 1=1`;
  let countSql = `SELECT COUNT(*) as total FROM email_queue WHERE 1=1`;

  if (status) {
    sql += ` AND eq.status = $${paramIdx}`;
    countSql += ` AND eq.status = $${paramIdx}`;
    params.push(status);
    paramIdx++;
  }

  sql += ' ORDER BY eq.created_at DESC';
  sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  params.push(limitNum, offset);

  const countResult = await query(countSql, params.slice(0, -2));
  const total = parseInt(countResult.rows[0].total);

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

const retryQueueItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `UPDATE email_queue SET status = 'pending', attempts = 0,
     last_error = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE queue_id = $1 RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) throw new NotFoundError('Queue item not found');

  emailQueueService.processQueue();

  res.json({ success: true, message: 'Queued for retry', data: result.rows[0] });
});

const cancelQueueItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `UPDATE email_queue SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE queue_id = $1 RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) throw new NotFoundError('Queue item not found');

  res.json({ success: true, message: 'Queue item cancelled', data: result.rows[0] });
});

const getQueueStats = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
      COUNT(*) as total
    FROM email_queue
  `);

  res.json({ success: true, data: result.rows[0] });
});

module.exports = {
  listQueue,
  retryQueueItem,
  cancelQueueItem,
  getQueueStats,
};
