const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

const ALLOWED_LAYOUTS = ['default', 'full-width', 'with-sidebar', 'centered', 'landing'];

const parseSections = (sections) => {
  if (!sections) return '[]';
  if (typeof sections === 'string') return sections;
  return JSON.stringify(sections);
};

exports.getAllPages = asyncHandler(async (req, res) => {
  const result = await query(`SELECT id, slug, title, meta_title, meta_description, published_status, layout_template, created_at, updated_at FROM shared.cms_pages ORDER BY created_at DESC`);
  res.json({ success: true, data: result.rows });
});

exports.getPageBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = await query(`SELECT * FROM shared.cms_pages WHERE slug = $1`, [slug]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Page not found.');
  }
  res.json({ success: true, data: result.rows[0] });
});

exports.createPage = asyncHandler(async (req, res) => {
  const { slug, title, content_html, meta_title, meta_description, published_status, sections, layout_template, custom_css, custom_js } = req.body;

  const checkSlug = await query(`SELECT id FROM shared.cms_pages WHERE slug = $1`, [slug]);
  if (checkSlug.rows.length > 0) {
    throw new ConflictError('Slug already exists.');
  }

  const result = await query(
    `INSERT INTO shared.cms_pages (slug, title, content_html, meta_title, meta_description, published_status, sections, layout_template, custom_css, custom_js)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      slug, title, content_html || '', meta_title || '', meta_description || '',
      published_status || 'draft', parseSections(sections),
      layout_template || 'default', custom_css || '', custom_js || ''
    ]
  );
  res.status(201).json({ success: true, data: result.rows[0], message: 'Page created successfully.' });
});

exports.updatePage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, title, content_html, meta_title, meta_description, published_status, sections, layout_template, custom_css, custom_js } = req.body;

  if (!slug && !title && !content_html && !meta_title && !meta_description && !published_status && !sections && !layout_template && !custom_css && !custom_js) {
    throw new ValidationError('No fields provided for update.');
  }

  const checkSlug = await query(`SELECT id FROM shared.cms_pages WHERE slug = $1 AND id != $2`, [slug, id]);
  if (checkSlug.rows.length > 0) {
    throw new ConflictError('Slug already in use by another page.');
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(slug); }
  if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
  if (content_html !== undefined) { fields.push(`content_html = $${idx++}`); values.push(content_html); }
  if (meta_title !== undefined) { fields.push(`meta_title = $${idx++}`); values.push(meta_title); }
  if (meta_description !== undefined) { fields.push(`meta_description = $${idx++}`); values.push(meta_description); }
  if (published_status !== undefined) { fields.push(`published_status = $${idx++}`); values.push(published_status); }
  if (sections !== undefined) { fields.push(`sections = $${idx++}`); values.push(parseSections(sections)); }
  if (layout_template !== undefined) {
    if (!ALLOWED_LAYOUTS.includes(layout_template)) {
      throw new ValidationError(`Invalid layout template. Allowed: ${ALLOWED_LAYOUTS.join(', ')}`);
    }
    fields.push(`layout_template = $${idx++}`);
    values.push(layout_template);
  }
  if (custom_css !== undefined) { fields.push(`custom_css = $${idx++}`); values.push(custom_css); }
  if (custom_js !== undefined) { fields.push(`custom_js = $${idx++}`); values.push(custom_js); }

  if (fields.length === 0) {
    throw new ValidationError('No valid fields provided.');
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await query(
    `UPDATE shared.cms_pages SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Page not found.');
  }

  res.json({ success: true, data: result.rows[0], message: 'Page updated successfully.' });
});

exports.deletePage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query(`DELETE FROM shared.cms_pages WHERE id = $1 RETURNING *`, [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Page not found.');
  }
  res.json({ success: true, message: 'Page deleted successfully.' });
});
