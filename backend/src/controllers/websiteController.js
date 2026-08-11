const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

module.exports = {
  // ───── PAGES ─────
  getAllPages: asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, slug, title, page_type, is_published, is_homepage, layout_template,
              meta_title, created_at, updated_at,
              (SELECT COUNT(*) FROM shared.website_sections WHERE page_id = p.id) as section_count
       FROM shared.website_pages p ORDER BY is_homepage DESC, created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  }),

  getPageBySlug: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT * FROM shared.website_pages WHERE slug = $1`,
      [slug]
    );
    if (result.rows.length === 0) throw new NotFoundError('Page not found.');
    const sections = await pool.query(
      `SELECT * FROM shared.website_sections WHERE page_id = $1 ORDER BY sort_order ASC`,
      [result.rows[0].id]
    );
    res.json({ success: true, data: { ...result.rows[0], sections: sections.rows } });
  }),

  getPageById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM shared.website_pages WHERE id = $1`, [id]);
    if (result.rows.length === 0) throw new NotFoundError('Page not found.');
    const sections = await pool.query(
      `SELECT * FROM shared.website_sections WHERE page_id = $1 ORDER BY sort_order ASC`,
      [id]
    );
    res.json({ success: true, data: { ...result.rows[0], sections: sections.rows } });
  }),

  createPage: asyncHandler(async (req, res) => {
    const { slug, title, page_type, is_published, is_homepage, layout_template,
            meta_title, meta_description, meta_keywords, custom_css, custom_js } = req.body;

    const existing = await pool.query(`SELECT id FROM shared.website_pages WHERE slug = $1`, [slug]);
    if (existing.rows.length > 0) throw new ConflictError('Slug already exists.');

    if (is_homepage) {
      await pool.query(`UPDATE shared.website_pages SET is_homepage = false WHERE is_homepage = true`);
    }

    const result = await pool.query(
      `INSERT INTO shared.website_pages (slug, title, page_type, is_published, is_homepage, layout_template, meta_title, meta_description, meta_keywords, custom_css, custom_js)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [slug, title, page_type || 'custom', is_published !== false, is_homepage || false,
       layout_template || 'default', meta_title || '', meta_description || '', meta_keywords || '',
       custom_css || '', custom_js || '']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Page created.' });
  }),

  updatePage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['slug','title','page_type','is_published','is_homepage','layout_template',
                     'meta_title','meta_description','meta_keywords','open_graph_image','custom_css','custom_js'];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        if (field === 'slug') {
          const dup = await pool.query(`SELECT id FROM shared.website_pages WHERE slug = $1 AND id != $2`, [req.body.slug, id]);
          if (dup.rows.length > 0) throw new ConflictError('Slug already in use.');
        }
        if (field === 'is_homepage' && req.body.is_homepage) {
          await pool.query(`UPDATE shared.website_pages SET is_homepage = false WHERE is_homepage = true`);
        }
        fields.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) throw new ValidationError('No fields to update.');
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE shared.website_pages SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Page not found.');
    res.json({ success: true, data: result.rows[0], message: 'Page updated.' });
  }),

  deletePage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await pool.query(`DELETE FROM shared.website_sections WHERE page_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM shared.website_pages WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) throw new NotFoundError('Page not found.');
    res.json({ success: true, message: 'Page deleted.' });
  }),

  getHomepage: asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT * FROM shared.website_pages WHERE is_homepage = true OR page_type = 'home' LIMIT 1`
    );
    if (result.rows.length === 0) throw new NotFoundError('No homepage configured.');
    const sections = await pool.query(
      `SELECT * FROM shared.website_sections WHERE page_id = $1 ORDER BY sort_order ASC`,
      [result.rows[0].id]
    );
    res.json({ success: true, data: { ...result.rows[0], sections: sections.rows } });
  }),

  getPublishedPage: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT * FROM shared.website_pages WHERE slug = $1 AND is_published = true LIMIT 1`,
      [slug]
    );
    if (result.rows.length === 0) throw new NotFoundError('Page not found.');
    const sections = await pool.query(
      `SELECT * FROM shared.website_sections WHERE page_id = $1 AND is_visible = true ORDER BY sort_order ASC`,
      [result.rows[0].id]
    );
    res.json({ success: true, data: { ...result.rows[0], sections: sections.rows } });
  }),

  // ───── SECTIONS ─────
  getSections: asyncHandler(async (req, res) => {
    const { pageId } = req.params;
    const result = await pool.query(
      `SELECT * FROM shared.website_sections WHERE page_id = $1 ORDER BY sort_order ASC`,
      [pageId]
    );
    res.json({ success: true, data: result.rows });
  }),

  addSection: asyncHandler(async (req, res) => {
    const { pageId } = req.params;
    const { section_type, settings, section_name } = req.body;

    const maxOrder = await pool.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 as next_sort FROM shared.website_sections WHERE page_id = $1`,
      [pageId]
    );

    const defaultSettings = {
      hero: { title: 'New Hero Section', subtitle: 'Your compelling value proposition here', layout: 'center', cta_primary: { text: 'Get Started', url: '/demo' }, cta_secondary: { text: 'Learn More', url: '/features' } },
      features: { title: 'Features', subtitle: 'Everything you need', items: [{ title: 'Feature 1', desc: 'Description', icon: 'StarIcon' }] },
      pricing: { title: 'Pricing Plans', subtitle: 'Choose the right plan', plans: [{ name: 'Starter', price: '$6', period: '/mo', features: ['Core HR'], popular: false }] },
      testimonials: { title: 'What Our Customers Say', items: [{ quote: 'Great product!', author: 'John Doe', role: 'CEO', rating: 5 }] },
      cta: { title: 'Ready to Get Started?', subtitle: 'Join thousands of companies', button_text: 'Get a Demo', button_url: '/demo', style: 'gradient' },
      content: { title: '', content: '<p>Your content here</p>' },
      faq: { title: 'FAQ', items: [{ question: 'Question?', answer: 'Answer here' }] },
      logos: { title: 'Trusted By', items: [{ name: 'Company 1' }] },
      stats: { title: 'By the Numbers', items: [{ value: '99%', label: 'Satisfaction' }] },
      team: { title: 'Our Team', items: [{ name: 'Jane Doe', role: 'CEO', bio: '' }] },
      newsletter: { title: 'Stay Updated', subtitle: 'Subscribe to our newsletter', button_text: 'Subscribe', placeholder: 'your@email.com' },
      contact_form: { title: 'Get In Touch', subtitle: 'We will respond within 24 hours', fields: ['name','email','message'] },
      blog_posts: { title: 'Latest from Our Blog', count: 3 },
      video: { title: '', url: '', autoplay: false },
      gallery: { title: '', items: [{ url: '', alt: '' }] },
      tabs: { title: '', items: [{ tab: 'Tab 1', content: '<p>Content</p>' }] },
      divider: { style: 'line', height: '1px', color: 'gray-200' },
      integrations: { title: 'Integrations', items: [{ name: 'Slack' }] },
      timeline: { title: 'Our Journey', items: [{ year: '2024', event: 'Milestone' }] },
      custom_html: { title: '', code: '<div>Custom HTML</div>' },
      banner: { text: 'Announcement', link: '', is_dismissible: true }
    };

    const mergedSettings = { ...(defaultSettings[section_type] || {}), ...(settings || {}) };

    const result = await pool.query(
      `INSERT INTO shared.website_sections (page_id, section_type, section_name, sort_order, settings, is_visible)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [pageId, section_type, section_name || `${section_type} section`, maxOrder.rows[0].next_sort, JSON.stringify(mergedSettings)]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  }),

  updateSection: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { section_type, section_name, settings, is_visible, sort_order, custom_class, custom_id, background, animation, visibility_rules } = req.body;

    const fields = []; const values = []; let idx = 1;
    if (section_type !== undefined) { fields.push(`section_type = $${idx++}`); values.push(section_type); }
    if (section_name !== undefined) { fields.push(`section_name = $${idx++}`); values.push(section_name); }
    if (settings !== undefined) { fields.push(`settings = $${idx++}`); values.push(typeof settings === 'string' ? settings : JSON.stringify(settings)); }
    if (is_visible !== undefined) { fields.push(`is_visible = $${idx++}`); values.push(is_visible); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sort_order); }
    if (custom_class !== undefined) { fields.push(`custom_class = $${idx++}`); values.push(custom_class); }
    if (custom_id !== undefined) { fields.push(`custom_id = $${idx++}`); values.push(custom_id); }
    if (background !== undefined) { fields.push(`background = $${idx++}`); values.push(typeof background === 'string' ? background : JSON.stringify(background)); }
    if (animation !== undefined) { fields.push(`animation = $${idx++}`); values.push(typeof animation === 'string' ? animation : JSON.stringify(animation)); }
    if (visibility_rules !== undefined) { fields.push(`visibility_rules = $${idx++}`); values.push(typeof visibility_rules === 'string' ? visibility_rules : JSON.stringify(visibility_rules)); }

    if (fields.length === 0) throw new ValidationError('No fields to update.');
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE shared.website_sections SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Section not found.');
    res.json({ success: true, data: result.rows[0] });
  }),

  reorderSections: asyncHandler(async (req, res) => {
    const { pageId } = req.params;
    const { section_ids } = req.body;
    if (!Array.isArray(section_ids)) throw new ValidationError('section_ids must be an array.');

    for (let i = 0; i < section_ids.length; i++) {
      await pool.query(
        `UPDATE shared.website_sections SET sort_order = $1 WHERE id = $2 AND page_id = $3`,
        [i, section_ids[i], pageId]
      );
    }
    res.json({ success: true, message: 'Sections reordered.' });
  }),

  deleteSection: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM shared.website_sections WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) throw new NotFoundError('Section not found.');
    res.json({ success: true, message: 'Section deleted.' });
  }),

  // ───── MEDIA ─────
  uploadMedia: asyncHandler(async (req, res) => {
    if (!req.file) throw new ValidationError('No file provided.');
    const result = await pool.query(
      `INSERT INTO shared.website_media (filename, original_name, mime_type, file_size, width, height)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size,
       req.body.width || null, req.body.height || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  }),

  getAllMedia: asyncHandler(async (req, res) => {
    const result = await pool.query(`SELECT * FROM shared.website_media ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows });
  }),

  deleteMedia: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM shared.website_media WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) throw new NotFoundError('Media not found.');
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../uploads/media', result.rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Media deleted.' });
  }),

  // ───── GLOBAL SETTINGS ─────
  getGlobalSettings: asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM shared.website_global_settings LIMIT 1');
    if (result.rows.length === 0) {
      await pool.query('INSERT INTO shared.website_global_settings (id) VALUES (1)');
      const retry = await pool.query('SELECT * FROM shared.website_global_settings LIMIT 1');
      return res.json({ success: true, data: retry.rows[0] });
    }
    res.json({ success: true, data: result.rows[0] });
  }),

  updateGlobalSettings: asyncHandler(async (req, res) => {
    const allowed = ['company_name','tagline','logo_url','favicon_url','primary_color','secondary_color',
                     'font_family','theme_mode','layout_width','social_links','contact_email','contact_phone',
                     'contact_address','header_config','footer_config','announcement_bar','cookie_consent',
                     'custom_css','custom_js','google_analytics_id','google_tag_manager_id'];

    const fields = []; const values = []; let idx = 1;

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(typeof req.body[field] === 'object' ? JSON.stringify(req.body[field]) : req.body[field]);
      }
    }

    if (req.files) {
      if (req.files.logo) { fields.push(`logo_url = $${idx++}`); values.push(`/uploads/website/${req.files.logo[0].filename}`); }
      if (req.files.favicon) { fields.push(`favicon_url = $${idx++}`); values.push(`/uploads/website/${req.files.favicon[0].filename}`); }
    }

    if (fields.length === 0) throw new ValidationError('No fields to update.');
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE shared.website_global_settings SET ${fields.join(', ')} WHERE id = 1 RETURNING *`,
      values
    );
    res.json({ success: true, data: result.rows[0], message: 'Global settings updated.' });
  }),

  getPublicGlobalSettings: asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT company_name, tagline, logo_url, favicon_url, primary_color, secondary_color,
              font_family, theme_mode, layout_width, social_links, contact_email, contact_phone,
              contact_address, header_config, footer_config, announcement_bar, cookie_consent
       FROM shared.website_global_settings LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.json({ success: true, data: {} });
    }
    res.json({ success: true, data: result.rows[0] });
  }),
};
