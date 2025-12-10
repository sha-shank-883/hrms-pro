const { query } = require('../config/database');

// --- Goals ---

// Get all goals for an employee
const getGoals = async (req, res) => {
    try {
        const { employee_id, status } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;

        let targetEmployeeId = employee_id;

        // If employee, can only see own goals unless specified otherwise
        if (userRole === 'employee') {
            const empResult = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
            if (empResult.rows.length > 0) {
                targetEmployeeId = empResult.rows[0].employee_id;
            }
        }

        let queryText = 'SELECT * FROM goals WHERE employee_id = $1';
        const params = [targetEmployeeId];

        if (status) {
            queryText += ' AND status = $2';
            params.push(status);
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch goals' });
    }
};

// Create a new goal
const createGoal = async (req, res) => {
    try {
        const { title, description, due_date, employee_id } = req.body;
        const userId = req.user.userId;

        let targetEmployeeId = employee_id;

        // If not provided (self-creation), get from user ID
        if (!targetEmployeeId) {
            const empResult = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
            if (empResult.rows.length > 0) {
                targetEmployeeId = empResult.rows[0].employee_id;
            }
        }

        const result = await query(
            `INSERT INTO goals (employee_id, title, description, due_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [targetEmployeeId, title, description, due_date]
        );

        res.status(201).json({
            success: true,
            message: 'Goal created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ success: false, message: 'Failed to create goal' });
    }
};

// Update a goal (progress, status)
const updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, progress, due_date } = req.body;

        const result = await query(
            `UPDATE goals 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status), 
           progress = COALESCE($4, progress), 
           due_date = COALESCE($5, due_date)
       WHERE goal_id = $6 RETURNING *`,
            [title, description, status, progress, due_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        res.json({
            success: true,
            message: 'Goal updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ success: false, message: 'Failed to update goal' });
    }
};

// Delete a goal
const deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM goals WHERE goal_id = $1', [id]);
        res.json({ success: true, message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete goal' });
    }
};

// --- Performance Cycles ---

const getCycles = async (req, res) => {
    try {
        const result = await query('SELECT * FROM performance_cycles ORDER BY start_date DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get cycles error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cycles' });
    }
};

const createCycle = async (req, res) => {
    try {
        const { title, start_date, end_date } = req.body;
        const result = await query(
            `INSERT INTO performance_cycles (title, start_date, end_date)
       VALUES ($1, $2, $3) RETURNING *`,
            [title, start_date, end_date]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Create cycle error:', error);
        res.status(500).json({ success: false, message: 'Failed to create cycle' });
    }
};

// --- Reviews ---

const getReviews = async (req, res) => {
    try {
        const { cycle_id, employee_id } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;

        let queryText = `
      SELECT pr.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             m.first_name || ' ' || m.last_name as reviewer_name,
             pc.title as cycle_title
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.employee_id
      LEFT JOIN employees m ON pr.reviewer_id = m.employee_id
      JOIN performance_cycles pc ON pr.cycle_id = pc.cycle_id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (userRole === 'employee') {
            // Employees see their own reviews
            const empResult = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
            if (empResult.rows.length > 0) {
                queryText += ` AND (pr.employee_id = $${paramCount} OR pr.reviewer_id = $${paramCount})`;
                params.push(empResult.rows[0].employee_id);
                paramCount++;
            }
        }

        if (cycle_id) {
            queryText += ` AND pr.cycle_id = $${paramCount}`;
            params.push(cycle_id);
            paramCount++;
        }

        if (employee_id && userRole !== 'employee') {
            queryText += ` AND pr.employee_id = $${paramCount}`;
            params.push(employee_id);
            paramCount++;
        }

        queryText += ' ORDER BY pc.start_date DESC';

        const result = await query(queryText, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT pr.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             m.first_name || ' ' || m.last_name as reviewer_name,
             pc.title as cycle_title
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.employee_id
            LEFT JOIN employees m ON pr.reviewer_id = m.employee_id
            JOIN performance_cycles pc ON pr.cycle_id = pc.cycle_id
            WHERE pr.review_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch review' });
    }
};

const createReview = async (req, res) => {
    try {
        const { employee_id, reviewer_id, cycle_id } = req.body;
        const result = await query(
            `INSERT INTO performance_reviews (employee_id, reviewer_id, cycle_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [employee_id, reviewer_id, cycle_id]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, message: 'Failed to create review' });
    }
};

const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { self_rating, manager_rating, self_comments, manager_comments, status } = req.body;

        const result = await query(
            `UPDATE performance_reviews
             SET self_rating = COALESCE($1, self_rating),
                 manager_rating = COALESCE($2, manager_rating),
                 self_comments = COALESCE($3, self_comments),
                 manager_comments = COALESCE($4, manager_comments),
                 status = COALESCE($5, status)
             WHERE review_id = $6 RETURNING *`,
            [self_rating, manager_rating, self_comments, manager_comments, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, message: 'Failed to update review' });
    }
};

module.exports = {
    getGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    getCycles,
    createCycle,
    getReviews,
    getReviewById,
    createReview,
    updateReview
};
