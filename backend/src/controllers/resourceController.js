const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError, NotFoundError } = require('../utils/errors');
const slugify = require('slugify');

const getResources = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM shared.resources ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
});

const getPublishedResources = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM shared.resources WHERE is_active = true ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
});

const getResourceBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = await pool.query('SELECT * FROM shared.resources WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new NotFoundError('Resource not found');
  res.json({ success: true, data: result.rows[0] });
});

const createResource = asyncHandler(async (req, res) => {
  const { title, type, content, excerpt, image_url, download_url, is_active } = req.body;
  
  if (!title || !type) throw new ValidationError('Title and type are required');
  
  const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now().toString().slice(-4);
  
  const result = await pool.query(
    `INSERT INTO shared.resources (title, slug, type, content, excerpt, image_url, download_url, is_active) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, slug, type, content, excerpt, image_url, download_url, is_active !== false]
  );
  
  res.status(21).json({ success: true, data: result.rows[0] });
});

const updateResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, type, content, excerpt, image_url, download_url, is_active } = req.body;
  
  const check = await pool.query('SELECT id FROM shared.resources WHERE id = $1', [id]);
  if (check.rows.length === 0) throw new NotFoundError('Resource not found');
  
  const result = await pool.query(
    `UPDATE shared.resources 
     SET title = $1, type = $2, content = $3, excerpt = $4, image_url = $5, download_url = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
     WHERE id = $8 RETURNING *`,
    [title, type, content, excerpt, image_url, download_url, is_active, id]
  );
  
  res.json({ success: true, data: result.rows[0] });
});

const deleteResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM shared.resources WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Resource not found');
  res.json({ success: true, message: 'Resource deleted' });
});

module.exports = {
  getResources,
  getPublishedResources,
  getResourceBySlug,
  createResource,
  updateResource,
  deleteResource
};
