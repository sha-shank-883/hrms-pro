const { query } = require('../config/database');
const { parseResumeResult } = require('../services/resumeParser');
const fs = require('fs');

// Get all job postings with pagination
const getAllJobPostings = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get job postings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job postings',
      error: error.message,
    });
  }
};

// Get single job posting
const getJobPostingById = async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job posting',
      error: error.message,
    });
  }
};

// Create job posting
const createJobPosting = async (req, res) => {
  try {
    const {
      title, description, department_id, position_type,
      experience_required, salary_range, location,
      requirements, responsibilities, deadline
    } = req.body;

    const posted_by = req.user.userId;

    const result = await query(
      `INSERT INTO job_postings (
        title, description, department_id, position_type, experience_required,
        salary_range, location, requirements, responsibilities, posted_by, deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        title, description, department_id || null, position_type || null, experience_required || null,
        salary_range || null, location || null, requirements || null, responsibilities || null, posted_by, deadline || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job posting',
      error: error.message,
    });
  }
};

// Update job posting
const updateJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, department_id, position_type,
      experience_required, salary_range, location,
      requirements, responsibilities, status, deadline
    } = req.body;

    const result = await query(
      `UPDATE job_postings 
       SET title = $1, description = $2, department_id = $3, position_type = $4,
           experience_required = $5, salary_range = $6, location = $7,
           requirements = $8, responsibilities = $9, status = $10, deadline = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE job_id = $12
       RETURNING *`,
      [
        title, description, department_id || null, position_type || null,
        experience_required || null, salary_range || null, location || null,
        requirements || null, responsibilities || null, status || 'open', deadline || null, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    res.json({
      success: true,
      message: 'Job posting updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job posting',
      error: error.message,
    });
  }
};

// Delete job posting
const deleteJobPosting = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM job_postings WHERE job_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    res.json({
      success: true,
      message: 'Job posting deleted successfully',
    });
  } catch (error) {
    console.error('Delete job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job posting',
      error: error.message,
    });
  }
};

// Get all job applications with pagination
const getAllApplications = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job applications',
      error: error.message,
    });
  }
};

// Create job application
const createApplication = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message,
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message,
    });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM job_applications WHERE application_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message,
    });
  }
};

// Parse resume
const parseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded',
      });
    }

    const filePath = req.file.path;
    const extractedData = await parseResumeResult(filePath);

    // Clean up file after parsing (optional, or keep it if we want to use it later)
    // For now, we delete it to save space as this is just a helper tool
    // The actual application submission will handle the permanent upload
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Parse resume error:', error);
    // Ensure file is deleted even on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to parse resume',
      error: error.message,
    });
  }
};

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
