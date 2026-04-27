const { query } = require('../config/database');

// GET all pages
exports.getAllPages = async (req, res) => {
  try {
    const result = await query(`SELECT * FROM shared.cms_pages ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pages.' });
  }
};

// GET single page by slug
exports.getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await query(`SELECT * FROM shared.cms_pages WHERE slug = $1`, [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ success: false, message: 'Server error fetching page.' });
  }
};

// CREATE a page
exports.createPage = async (req, res) => {
  try {
    const { slug, title, content_html, meta_title, meta_description, published_status, sections } = req.body;
    
    // Check if slug exists
    const checkSlug = await query(`SELECT id FROM shared.cms_pages WHERE slug = $1`, [slug]);
    if (checkSlug.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Slug already exists.' });
    }

    const result = await query(
      `INSERT INTO shared.cms_pages (slug, title, content_html, meta_title, meta_description, published_status, sections) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [slug, title, content_html, meta_title, meta_description, published_status || 'draft', sections ? JSON.stringify(sections) : '[]']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Page created successfully.' });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ success: false, message: 'Server error creating page.' });
  }
};

// UPDATE a page
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, content_html, meta_title, meta_description, published_status, sections } = req.body;

    // Check if new slug exists for a DIFFERENT page
    const checkSlug = await query(`SELECT id FROM shared.cms_pages WHERE slug = $1 AND id != $2`, [slug, id]);
    if (checkSlug.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Slug already in use by another page.' });
    }

    const result = await query(
      `UPDATE shared.cms_pages 
       SET slug = $1, title = $2, content_html = $3, meta_title = $4, meta_description = $5, published_status = $6, sections = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [slug, title, content_html, meta_title, meta_description, published_status, sections ? JSON.stringify(sections) : '[]', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found.' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Page updated successfully.' });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ success: false, message: 'Server error updating page.' });
  }
};

// DELETE a page
exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM shared.cms_pages WHERE id = $1 RETURNING *`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found.' });
    }

    res.json({ success: true, message: 'Page deleted successfully.' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, message: 'Server error deleting page.' });
  }
};
