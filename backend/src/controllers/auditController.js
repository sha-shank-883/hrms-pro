const { query } = require('../config/database');

const getLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, action, user, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
      SELECT l.*, e.first_name, e.last_name, u.email 
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.user_id
      LEFT JOIN employees e ON l.user_id = e.user_id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (action) {
            queryText += ` AND l.action = $${paramCount}`;
            params.push(action);
            paramCount++;
        }

        if (user) {
            queryText += ` AND (e.first_name ILIKE $${paramCount} OR e.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
            params.push(`%${user}%`);
            paramCount++;
        }

        if (req.query.user_id) {
            queryText += ` AND l.user_id = $${paramCount}`;
            params.push(req.query.user_id);
            paramCount++;
        }

        if (startDate) {
            queryText += ` AND l.created_at >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            queryText += ` AND l.created_at <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
        }

        // Get total count for pagination
        const countResult = await query(`SELECT COUNT(*) FROM (${queryText}) as count_table`, params);
        const total = parseInt(countResult.rows[0].count);

        // Add sorting and pagination
        queryText += ` ORDER BY l.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);

        res.json({
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getLogs
};
