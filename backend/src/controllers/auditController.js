const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const getLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, action, user, startDate, endDate } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  let baseQuery = `
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.user_id
      LEFT JOIN employees e ON l.user_id = e.user_id
      WHERE 1=1
    `;
  const params = [];
  let paramCount = 1;

  if (action) {
    baseQuery += ` AND l.action = $${paramCount}`;
    params.push(action);
    paramCount++;
  }

  if (user) {
    baseQuery += ` AND (e.first_name ILIKE $${paramCount} OR e.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
    params.push(`%${user}%`);
    paramCount++;
  }

  if (req.query.user_id) {
    baseQuery += ` AND l.user_id = $${paramCount}`;
    params.push(req.query.user_id);
    paramCount++;
  }

  if (startDate) {
    baseQuery += ` AND l.created_at >= $${paramCount}`;
    params.push(startDate);
    paramCount++;
  }

  if (endDate) {
    baseQuery += ` AND l.created_at <= $${paramCount}`;
    params.push(endDate);
    paramCount++;
  }

  // Get total count for pagination
  const countResult = await query(`SELECT COUNT(*) as count ${baseQuery}`, params);
  const total = parseInt(countResult.rows[0]?.count || 0);

  // Add sorting and pagination
  const dataQuery = `SELECT l.*, e.first_name, e.last_name, u.email ${baseQuery} ORDER BY l.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  const dataParams = [...params, limitNum, offset];

  const result = await query(dataQuery, dataParams);

  res.json({
    data: result.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

module.exports = {
  getLogs
};
