const { query } = require('../config/database');
const { parseResumeResult } = require('../services/resumeParser');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

// Get all job postings with pagination
const getAllJobPostings = asyncHandler(async (req, res) => {
  const { status, department_id, page = 1, limit = 10 } = req.query;

  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
  const offset = (pageNum - 1) * limitNum;

  let queryText = `
    SELECT jp.*, 
           d.department_name,
           u.email as posted_by_email,
           COUNT(DISTINCT ja.application_id) as application_count
    FROM job_postings jp
    LEFT JOIN departments d ON jp.department_id = d.department_id
    LEFT JOIN users u ON jp.posted_by = u.user_id
    LEFT JOIN job_applications ja ON jp.job_id = ja.job_id
    WHERE 1=1
  `;
  let countQueryText = `
    SELECT COUNT(*) as total
    FROM job_postings jp
    LEFT JOIN departments d ON jp.department_id = d.department_id
    LEFT JOIN users u ON jp.posted_by = u.user_id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  if (status) {
    queryText += ` AND jp.status = $${paramCount}`;
    countQueryText += ` AND jp.status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (department_id) {
    queryText += ` AND jp.department_id = $${paramCount}`;
    countQueryText += ` AND jp.department_id = $${paramCount}`;
    params.push(department_id);
    paramCount++;
  }

  queryText += ' GROUP BY jp.job_id, d.department_name, u.email ORDER BY jp.created_at DESC';

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

// Get single job posting
const getJobPostingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT jp.*, 
            d.department_name,
            u.email as posted_by_email
     FROM job_postings jp
     LEFT JOIN departments d ON jp.department_id = d.department_id
     LEFT JOIN users u ON jp.posted_by = u.user_id
     WHERE jp.job_id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Job posting not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

// Create job posting
const createJobPosting = asyncHandler(async (req, res) => {
  const {
    title, description, department_id, position_type,
    experience_required, salary_range, location,
    requirements, responsibilities, deadline
  } = req.body;

  const rawPostedBy = req.user?.userId || req.user?.id || req.user?.user_id || null;
  let posted_by = null;
  if (rawPostedBy) {
    try {
      const uCheck = await query('SELECT user_id FROM users WHERE user_id = $1', [rawPostedBy]);
      if (uCheck.rows.length > 0) {
        posted_by = rawPostedBy;
      }
    } catch (_) {}
  }

  let validDeptId = null;
  if (department_id && !isNaN(parseInt(department_id))) {
    try {
      const dCheck = await query('SELECT department_id FROM departments WHERE department_id = $1', [parseInt(department_id)]);
      if (dCheck.rows.length > 0) {
        validDeptId = parseInt(department_id);
      }
    } catch (_) {}
  }

  const validDeadline = (deadline && String(deadline).trim() !== '') ? deadline : null;
  const finalDesc = description || title || '';

  const result = await query(
    `INSERT INTO job_postings (
      title, description, department_id, position_type, experience_required,
      salary_range, location, requirements, responsibilities, posted_by, deadline
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      title, finalDesc, validDeptId, position_type || null, experience_required || null,
      salary_range || null, location || null, requirements || null, responsibilities || null, posted_by, validDeadline
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Job posting created successfully',
    data: result.rows[0],
  });
});

// Update job posting
const updateJobPosting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title, description, department_id, position_type,
    experience_required, salary_range, location,
    requirements, responsibilities, status, deadline
  } = req.body;

  let validDeptId = null;
  if (department_id && !isNaN(parseInt(department_id))) {
    try {
      const dCheck = await query('SELECT department_id FROM departments WHERE department_id = $1', [parseInt(department_id)]);
      if (dCheck.rows.length > 0) {
        validDeptId = parseInt(department_id);
      }
    } catch (_) {}
  }

  const validDeadline = (deadline && String(deadline).trim() !== '') ? deadline : null;
  const finalDesc = description || title || '';

  const result = await query(
    `UPDATE job_postings 
     SET title = $1, description = $2, department_id = $3, position_type = $4,
         experience_required = $5, salary_range = $6, location = $7,
         requirements = $8, responsibilities = $9, status = $10, deadline = $11,
         updated_at = CURRENT_TIMESTAMP
     WHERE job_id = $12
     RETURNING *`,
    [
      title, finalDesc, validDeptId, position_type || null,
      experience_required || null, salary_range || null, location || null,
      requirements || null, responsibilities || null, status || 'open', validDeadline, id
    ]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Job posting not found');
  }

  res.json({
    success: true,
    message: 'Job posting updated successfully',
    data: result.rows[0],
  });
});

// Delete job posting
const deleteJobPosting = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM job_postings WHERE job_id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Job posting not found');
  }

  res.json({
    success: true,
    message: 'Job posting deleted successfully',
  });
});

// Get all job applications with pagination
const getAllApplications = asyncHandler(async (req, res) => {
  const { job_id, status, page = 1, limit = 10 } = req.query;

  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
  const offset = (pageNum - 1) * limitNum;

  let queryText = `
    SELECT ja.*, jp.title as job_title
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_id = jp.job_id
    WHERE 1=1
  `;
  let countQueryText = `
    SELECT COUNT(*) as total
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_id = jp.job_id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  if (job_id) {
    queryText += ` AND ja.job_id = $${paramCount}`;
    countQueryText += ` AND ja.job_id = $${paramCount}`;
    params.push(job_id);
    paramCount++;
  }

  if (status) {
    queryText += ` AND ja.status = $${paramCount}`;
    countQueryText += ` AND ja.status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  queryText += ' ORDER BY ja.created_at DESC';

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

// Create job application
const createApplication = asyncHandler(async (req, res) => {
  const {
    job_id, applicant_name, email, phone, resume_url,
    cover_letter, experience_years, current_salary, expected_salary
  } = req.body;

  const result = await query(
    `INSERT INTO job_applications (
      job_id, applicant_name, email, phone, resume_url, cover_letter,
      experience_years, current_salary, expected_salary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      job_id, applicant_name, email, phone || null, resume_url || null,
      cover_letter || null, experience_years || null, current_salary || null, expected_salary || null
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: result.rows[0],
  });
});

// Update application status
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, interview_date, notes } = req.body;

  const result = await query(
    `UPDATE job_applications 
     SET status = $1, interview_date = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
     WHERE application_id = $4
     RETURNING *`,
    [status, interview_date || null, notes || null, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Application not found');
  }

  res.json({
    success: true,
    message: 'Application status updated successfully',
    data: result.rows[0],
  });
});

// Delete application
const deleteApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM job_applications WHERE application_id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Application not found');
  }

  res.json({
    success: true,
    message: 'Application deleted successfully',
  });
});

// Parse resume
const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No resume file uploaded');
  }

  try {
    const filePath = req.file.path;
    const extractedData = await parseResumeResult(filePath);

    // Clean up file after parsing (optional, or keep it if we want to use it later)
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    // Ensure file is deleted even on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

module.exports = {
  getAllJobPostings,
  getJobPostingById,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getAllApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  parseResume,
};
