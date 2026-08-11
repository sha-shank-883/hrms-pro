const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

const getPublishedPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, featured } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = ['published = true'];
  const params = [];
  let idx = 1;

  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }
  if (featured === 'true') {
    conditions.push('featured = true');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM shared.blog_posts ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await pool.query(
    `SELECT id, slug, title, excerpt, category, tags, author_name, author_role, author_image,
            image_url, featured, published_at, read_time, created_at
     FROM shared.blog_posts ${whereClause}
     ORDER BY featured DESC, published_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, parseInt(limit), offset]
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

const getPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = await pool.query(
    `SELECT * FROM shared.blog_posts WHERE slug = $1 AND published = true`,
    [slug]
  );
  if (result.rows.length === 0) throw new NotFoundError('Blog post not found');
  res.json({ success: true, data: result.rows[0] });
});

const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT * FROM shared.blog_posts WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Blog post not found');
  res.json({ success: true, data: result.rows[0] });
});

const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const countResult = await pool.query('SELECT COUNT(*) FROM shared.blog_posts');
  const total = parseInt(countResult.rows[0].count);

  const result = await pool.query(
    `SELECT id, slug, title, excerpt, category, tags, author_name, author_role,
            image_url, featured, published, published_at, created_at, updated_at
     FROM shared.blog_posts
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [parseInt(limit), offset]
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
  });
});

const createPost = asyncHandler(async (req, res) => {
  const { slug, title, excerpt, content_html, category, tags, author_name, author_role, author_image, image_url, featured, published, meta_title, meta_description, read_time } = req.body;

  if (!slug || !title || !content_html) {
    throw new ValidationError('slug, title, and content_html are required');
  }

  const check = await pool.query('SELECT id FROM shared.blog_posts WHERE slug = $1', [slug]);
  if (check.rows.length > 0) throw new ConflictError('Slug already exists');

  const result = await pool.query(
    `INSERT INTO shared.blog_posts (slug, title, excerpt, content_html, category, tags, author_name, author_role, author_image, image_url, featured, published, published_at, meta_title, meta_description, read_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
    [slug, title, excerpt, content_html, category || null, tags ? JSON.stringify(tags) : '[]', author_name || 'HRMS Pro', author_role || 'Team', author_image || null, image_url || null, featured || false, published || false, published ? new Date() : null, meta_title || null, meta_description || null, read_time || null]
  );

  res.status(201).json({ success: true, data: result.rows[0], message: 'Blog post created' });
});

const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, title, excerpt, content_html, category, tags, author_name, author_role, author_image, image_url, featured, published, meta_title, meta_description, read_time } = req.body;

  const existing = await pool.query('SELECT * FROM shared.blog_posts WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new NotFoundError('Blog post not found');

  if (slug) {
    const check = await pool.query('SELECT id FROM shared.blog_posts WHERE slug = $1 AND id != $2', [slug, id]);
    if (check.rows.length > 0) throw new ConflictError('Slug already in use');
  }

  const fields = [];
  const params = [];
  let idx = 1;

  if (slug !== undefined) { fields.push(`slug = $${idx++}`); params.push(slug); }
  if (title !== undefined) { fields.push(`title = $${idx++}`); params.push(title); }
  if (excerpt !== undefined) { fields.push(`excerpt = $${idx++}`); params.push(excerpt); }
  if (content_html !== undefined) { fields.push(`content_html = $${idx++}`); params.push(content_html); }
  if (category !== undefined) { fields.push(`category = $${idx++}`); params.push(category); }
  if (tags !== undefined) { fields.push(`tags = $${idx++}`); params.push(JSON.stringify(tags)); }
  if (author_name !== undefined) { fields.push(`author_name = $${idx++}`); params.push(author_name); }
  if (author_role !== undefined) { fields.push(`author_role = $${idx++}`); params.push(author_role); }
  if (author_image !== undefined) { fields.push(`author_image = $${idx++}`); params.push(author_image); }
  if (image_url !== undefined) { fields.push(`image_url = $${idx++}`); params.push(image_url); }
  if (featured !== undefined) { fields.push(`featured = $${idx++}`); params.push(featured); }
  if (published !== undefined) { fields.push(`published = $${idx++}`, `published_at = $${idx + 1}`); params.push(published); params.push(published ? new Date() : null); idx++; }
  if (meta_title !== undefined) { fields.push(`meta_title = $${idx++}`); params.push(meta_title); }
  if (meta_description !== undefined) { fields.push(`meta_description = $${idx++}`); params.push(meta_description); }
  if (read_time !== undefined) { fields.push(`read_time = $${idx++}`); params.push(read_time); }

  if (fields.length === 0) throw new ValidationError('No fields to update');

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await pool.query(
    `UPDATE shared.blog_posts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    [...params, id]
  );

  res.json({ success: true, data: result.rows[0], message: 'Blog post updated' });
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM shared.blog_posts WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Blog post not found');
  res.json({ success: true, message: 'Blog post deleted' });
});

module.exports = {
  getPublishedPosts,
  getPostBySlug,
  getPostById,
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
};
