const { query } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB default
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only documents and images are allowed.'));
  }
});

// Get all documents with pagination
const getAllDocuments = async (req, res) => {
  try {
    const { employee_id, department_id, document_type, is_confidential, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;
    
    let queryText = `
      SELECT d.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             dept.department_name,
             u.email as uploaded_by_email,
             d.created_at as uploaded_at
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.employee_id
      LEFT JOIN departments dept ON e.department_id = dept.department_id
      LEFT JOIN users u ON d.uploaded_by = u.user_id
      WHERE 1=1
    `;
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.employee_id
      LEFT JOIN departments dept ON e.department_id = dept.department_id
      LEFT JOIN users u ON d.uploaded_by = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering: employees can only see their own documents or public (non-confidential) documents
    let employeeFilterApplied = false;
    if (userRole === 'employee') {
      // Get the employee_id for this user
      const employeeResult = await query(
        'SELECT employee_id FROM employees WHERE user_id = $1',
        [userId]
      );
      
      if (employeeResult.rows.length > 0) {
        const userEmployeeId = employeeResult.rows[0].employee_id;
        // Employees can see their own documents OR non-confidential documents
        // Using parentheses to ensure proper OR logic
        queryText += ` AND (d.employee_id = $${paramCount} OR d.is_confidential = false)`;
        countQueryText += ` AND (d.employee_id = $${paramCount} OR d.is_confidential = false)`;
        params.push(userEmployeeId);
        paramCount++;
        employeeFilterApplied = true;
      } else {
        // If no employee record found, only show public documents
        queryText += ` AND d.is_confidential = false`;
        countQueryText += ` AND d.is_confidential = false`;
      }
    }

    // Apply employee_id filter only if not already applied for employees
    if (employee_id && !(userRole === 'employee' && employeeFilterApplied)) {
      queryText += ` AND d.employee_id = $${paramCount}`;
      countQueryText += ` AND d.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND e.department_id = $${paramCount}`;
      countQueryText += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (document_type) {
      queryText += ` AND d.document_type = $${paramCount}`;
      countQueryText += ` AND d.document_type = $${paramCount}`;
      params.push(document_type);
      paramCount++;
    }

    if (is_confidential !== undefined) {
      queryText += ` AND d.is_confidential = $${paramCount}`;
      countQueryText += ` AND d.is_confidential = $${paramCount}`;
      params.push(is_confidential === 'true');
      paramCount++;
    }

    queryText += ' ORDER BY d.created_at DESC';
    
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
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message,
    });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    const { employee_id, document_type, title, description, file_url, is_confidential, expiry_date } = req.body;
    const uploaded_by = req.user.userId;

    // Check if it's a file upload or URL submission
    if (req.file) {
      // File upload method
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileSize = req.file.size;
      const documentName = req.file.originalname;

      // For public documents, we can set employee_id to NULL
      const finalEmployeeId = employee_id || null;
      
      const result = await query(
        `INSERT INTO documents (
          employee_id, document_type, document_name, file_url, file_size,
          uploaded_by, description, is_confidential, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          finalEmployeeId, document_type, documentName, fileUrl, fileSize,
          uploaded_by, description || null, is_confidential === 'true' || false, expiry_date || null
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: result.rows[0],
      });
    } else if (file_url) {
      // URL submission method
      // For public documents, employee_id is optional
      const documentName = title || 'Document';
      
      const result = await query(
        `INSERT INTO documents (
          employee_id, document_type, document_name, file_url,
          uploaded_by, description, is_confidential, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          employee_id || null, document_type, documentName, file_url,
          uploaded_by, description || null, is_confidential || false, expiry_date || null
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: result.rows[0],
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either file upload or file URL is required',
      });
    }
  } catch (error) {
    console.error('Upload document error:', error);
    // Delete uploaded file if database insertion fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message,
    });
  }
};

// Get single document
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT d.*, 
              e.first_name || ' ' || e.last_name as employee_name,
              u.email as uploaded_by_email
       FROM documents d
       LEFT JOIN employees e ON d.employee_id = e.employee_id
       LEFT JOIN users u ON d.uploaded_by = u.user_id
       WHERE d.document_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: error.message,
    });
  }
};

// Update document
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, title, document_type, description, file_url, is_confidential, expiry_date } = req.body;

    // Build update query dynamically
    let updateFields = [];
    let params = [];
    let paramCount = 1;

    if (employee_id !== undefined) {
      updateFields.push(`employee_id = $${paramCount}`);
      // For public documents, we can set employee_id to NULL
      params.push(employee_id || null);
      paramCount++;
    }

    if (title !== undefined) {
      updateFields.push(`document_name = $${paramCount}`);
      params.push(title);
      paramCount++;
    }

    if (document_type !== undefined) {
      updateFields.push(`document_type = $${paramCount}`);
      params.push(document_type);
      paramCount++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      params.push(description || null);
      paramCount++;
    }

    if (file_url !== undefined) {
      updateFields.push(`file_url = $${paramCount}`);
      params.push(file_url);
      paramCount++;
    }

    if (is_confidential !== undefined) {
      updateFields.push(`is_confidential = $${paramCount}`);
      params.push(is_confidential || false);
      paramCount++;
    }

    if (expiry_date !== undefined) {
      updateFields.push(`expiry_date = $${paramCount}`);
      params.push(expiry_date || null);
      paramCount++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await query(
      `UPDATE documents 
       SET ${updateFields.join(', ')}
       WHERE document_id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message,
    });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Get file path before deleting
    const docResult = await query(
      'SELECT file_url FROM documents WHERE document_id = $1',
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const fileUrl = docResult.rows[0].file_url;
    const filePath = path.join(__dirname, '../../', fileUrl);

    // Delete from database
    await query('DELETE FROM documents WHERE document_id = $1', [id]);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  getAllDocuments,
  uploadDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
};