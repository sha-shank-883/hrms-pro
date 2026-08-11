const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

// --- Goals ---

// Get all goals for an employee
const getGoals = asyncHandler(async (req, res) => {
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

  let queryText = `
    SELECT g.*, 
           json_agg(
               CASE WHEN kr.kr_id IS NOT NULL THEN
                   json_build_object(
                       'kr_id', kr.kr_id,
                       'title', kr.title,
                       'metric_type', kr.metric_type,
                       'target_value', kr.target_value,
                       'current_value', kr.current_value,
                       'status', kr.status
                   )
               ELSE NULL END
           ) as key_results
    FROM goals g
    LEFT JOIN key_results kr ON g.goal_id = kr.goal_id
    WHERE g.employee_id = $1
  `;
  const params = [targetEmployeeId];

  if (status) {
    queryText += ' AND g.status = $2';
    params.push(status);
  }

  queryText += ' GROUP BY g.goal_id ORDER BY g.created_at DESC';

  const result = await query(queryText, params);

  // Clean up json_agg results (remove nulls if no KRs)
  const cleanedRows = result.rows.map(row => ({
    ...row,
    key_results: row.key_results.filter(kr => kr !== null)
  }));

  res.json({
    success: true,
    data: cleanedRows
  });
});

// Create a new goal with optional key results
const createGoal = asyncHandler(async (req, res) => {
  const { title, description, due_date, employee_id, category, priority, weightage, key_results } = req.body;
  const userId = req.user.userId;

  if (!title) {
    throw new ValidationError('Goal title is required');
  }

  let targetEmployeeId = employee_id;
  if (!targetEmployeeId) {
    const empResult = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
    if (empResult.rows.length > 0) {
      targetEmployeeId = empResult.rows[0].employee_id;
    }
  }

  if (!targetEmployeeId) {
    throw new ValidationError('Employee not found for this user');
  }

  const goalResult = await query(
    `INSERT INTO goals (employee_id, title, description, due_date, category, priority, weightage)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [targetEmployeeId, title, description, due_date, category || 'General', priority || 'medium', weightage || 0]
  );

  const newGoal = goalResult.rows[0];

  // Insert Key Results if provided
  if (key_results && Array.isArray(key_results) && key_results.length > 0) {
    for (const kr of key_results) {
      await query(
        `INSERT INTO key_results (goal_id, title, metric_type, target_value, current_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [newGoal.goal_id, kr.title, kr.metric_type || 'percentage', kr.target_value || 100, kr.current_value || 0]
      );
    }
  }

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: newGoal
  });
});

// Update Key Result Progress
const updateKeyResult = asyncHandler(async (req, res) => {
  const { id } = req.params; // kr_id
  const { current_value, status } = req.body;

  const result = await query(
    `UPDATE key_results SET current_value = $1, status = COALESCE($2, status), updated_at = CURRENT_TIMESTAMP 
     WHERE kr_id = $3 RETURNING *`,
    [current_value, status, id]
  );

  res.json({ success: true, data: result.rows[0] });
});

// Update a goal (progress, status, and synchronization of Key Results)
const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, progress, due_date, key_results, category, priority, weightage } = req.body;

  // 1. Update Goal Basic Fields
  const result = await query(
    `UPDATE goals 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status), 
           progress = COALESCE($4, progress), 
           due_date = COALESCE($5, due_date),
           category = COALESCE($6, category),
           priority = COALESCE($7, priority),
           weightage = COALESCE($8, weightage),
           updated_at = CURRENT_TIMESTAMP
       WHERE goal_id = $9 RETURNING *`,
    [title, description, status, progress, due_date, category, priority, weightage, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Goal not found');
  }

  const updatedGoal = result.rows[0];

  // 2. Sync Key Results if provided
  if (key_results && Array.isArray(key_results)) {
    // Fetch existing KRs
    const userKRs = key_results; // from request
    const existingKRsResult = await query('SELECT kr_id FROM key_results WHERE goal_id = $1', [id]);
    const existingKRIds = existingKRsResult.rows.map(r => r.kr_id);

    const incomingKRIds = userKRs.filter(kr => kr.kr_id).map(kr => kr.kr_id);

    // A. Delete KRs that are not in the incoming list
    const toDelete = existingKRIds.filter(kid => !incomingKRIds.includes(kid));
    if (toDelete.length > 0) {
      for (const delId of toDelete) {
        await query('DELETE FROM key_results WHERE kr_id = $1', [delId]);
      }
    }

    // B. Upsert (Update existing, Insert new)
    for (const kr of userKRs) {
      if (kr.kr_id) {
        // Update
        await query(
          `UPDATE key_results 
           SET title = $1, target_value = $2, current_value = $3, metric_type = $4, status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP
           WHERE kr_id = $6`,
          [kr.title, kr.target_value, kr.current_value, kr.metric_type, kr.status, kr.kr_id]
        );
      } else {
        // Insert
        await query(
          `INSERT INTO key_results (goal_id, title, metric_type, target_value, current_value)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, kr.title, kr.metric_type || 'percentage', kr.target_value || 100, kr.current_value || 0]
        );
      }
    }
  }

  res.json({
    success: true,
    message: 'Goal updated successfully',
    data: updatedGoal
  });
});

// Delete a goal
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM goals WHERE goal_id = $1', [id]);
  res.json({ success: true, message: 'Goal deleted successfully' });
});

// --- Performance Cycles ---

const getCycles = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM performance_cycles ORDER BY start_date DESC');
  res.json({ success: true, data: result.rows });
});

const createCycle = asyncHandler(async (req, res) => {
  const { title, start_date, end_date } = req.body;
  if (!title) {
    throw new ValidationError('Cycle title is required');
  }
  if (!start_date) {
    throw new ValidationError('Start date is required');
  }
  if (!end_date) {
    throw new ValidationError('End date is required');
  }
  const result = await query(
    `INSERT INTO performance_cycles (title, start_date, end_date)
       VALUES ($1, $2, $3) RETURNING *`,
    [title, start_date, end_date]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

// --- Reviews ---

const getReviews = asyncHandler(async (req, res) => {
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
});

const getReviewById = asyncHandler(async (req, res) => {
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
    throw new NotFoundError('Review not found');
  }
  res.json({ success: true, data: result.rows[0] });
});

const createReview = asyncHandler(async (req, res) => {
  const { employee_id, reviewer_id, cycle_id } = req.body;
  if (!employee_id) {
    throw new ValidationError('Employee ID is required');
  }
  if (!reviewer_id) {
    throw new ValidationError('Reviewer ID is required');
  }
  if (!cycle_id) {
    throw new ValidationError('Cycle ID is required');
  }
  const result = await query(
    `INSERT INTO performance_reviews (employee_id, reviewer_id, cycle_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [employee_id, reviewer_id, cycle_id]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

const updateReview = asyncHandler(async (req, res) => {
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
    throw new NotFoundError('Review not found');
  }
  res.json({ success: true, data: result.rows[0] });
});

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
  updateReview,
  updateKeyResult
};
