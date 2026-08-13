const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

const ALLOWED_PARAM_KEYS = ['colors', 'typography', 'radii', 'shadows', 'spacing', 'mode', 'branding'];

const sanitizeParameters = (parameters) => {
  if (parameters === undefined) return undefined;
  if (parameters === null || typeof parameters !== 'object' || Array.isArray(parameters)) {
    throw new ValidationError('parameters must be a JSON object.');
  }
  const sanitized = {};
  for (const key of ALLOWED_PARAM_KEYS) {
    if (parameters[key] !== undefined) sanitized[key] = parameters[key];
  }
  return sanitized;
};

module.exports = {
  // ───── LIST (admin) ─────
  getAllThemes: asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, name, slug, is_active, parameters, is_system, created_at, updated_at
       FROM shared.website_themes ORDER BY is_active DESC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  }),

  getThemeById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, slug, is_active, parameters, is_system, created_at, updated_at
       FROM shared.website_themes WHERE id = $1`, [id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Theme not found.');
    res.json({ success: true, data: result.rows[0] });
  }),

  createTheme: asyncHandler(async (req, res) => {
    const { name, slug, is_active, parameters } = req.body;
    if (!name || !name.trim()) throw new ValidationError('Theme name is required.');
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new ValidationError('Invalid theme slug.');

    const dup = await pool.query(`SELECT id FROM shared.website_themes WHERE slug = $1`, [slug]);
    if (dup.rows.length > 0) throw new ConflictError('Theme slug already exists.');

    const sanitized = sanitizeParameters(parameters);

    const result = await pool.query(
      `INSERT INTO shared.website_themes (name, slug, is_active, parameters, is_system)
       VALUES ($1, $2, $3, $4, false) RETURNING *`,
      [name.trim(), slug, !!is_active, JSON.stringify(sanitized || {})]
    );

    if (result.rows[0].is_active) {
      await pool.query(`UPDATE shared.website_themes SET is_active = (id = $1)`, [result.rows[0].id]);
      await linkActiveTheme(result.rows[0].id);
    }

    res.status(201).json({ success: true, data: result.rows[0], message: 'Theme created.' });
  }),

  updateTheme: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, slug, is_active, parameters } = req.body;

    const existing = await pool.query(`SELECT id FROM shared.website_themes WHERE id = $1`, [id]);
    if (existing.rows.length === 0) throw new NotFoundError('Theme not found.');

    const fields = []; const values = []; let idx = 1;

    if (name !== undefined) {
      if (!name.trim()) throw new ValidationError('Theme name cannot be empty.');
      fields.push(`name = $${idx++}`); values.push(name.trim());
    }
    if (slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(slug)) throw new ValidationError('Invalid theme slug.');
      const dup = await pool.query(`SELECT id FROM shared.website_themes WHERE slug = $1 AND id != $2`, [slug, id]);
      if (dup.rows.length > 0) throw new ConflictError('Theme slug already in use.');
      fields.push(`slug = $${idx++}`); values.push(slug);
    }
    if (parameters !== undefined) {
      const sanitized = sanitizeParameters(parameters);
      fields.push(`parameters = $${idx++}`); values.push(JSON.stringify(sanitized || {}));
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${idx++}`); values.push(!!is_active);
    }

    if (fields.length === 0) throw new ValidationError('No fields to update.');
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE shared.website_themes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );

    if (is_active) {
      await pool.query(`UPDATE shared.website_themes SET is_active = (id = $1)`, [id]);
      await linkActiveTheme(id);
    }

    res.json({ success: true, data: result.rows[0], message: 'Theme updated.' });
  }),

  activateTheme: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await pool.query(`SELECT id FROM shared.website_themes WHERE id = $1`, [id]);
    if (existing.rows.length === 0) throw new NotFoundError('Theme not found.');

    await pool.query(`UPDATE shared.website_themes SET is_active = (id = $1), updated_at = CURRENT_TIMESTAMP`, [id]);
    await linkActiveTheme(id);

    res.json({ success: true, message: 'Theme activated.' });
  }),

  deleteTheme: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await pool.query(
      `SELECT is_system, is_active FROM shared.website_themes WHERE id = $1`, [id]
    );
    if (existing.rows.length === 0) throw new NotFoundError('Theme not found.');
    if (existing.rows[0].is_system) throw new ValidationError('System themes cannot be deleted.');
    if (existing.rows[0].is_active) throw new ValidationError('Cannot delete the active theme. Activate another theme first.');

    await pool.query(`DELETE FROM shared.website_themes WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Theme deleted.' });
  }),

  // ───── PUBLIC ─────
  getActiveTheme: asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, name, slug, parameters FROM shared.website_themes WHERE is_active = true LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: result.rows[0] });
  }),
};

async function linkActiveTheme(themeId) {
  await pool.query(
    `INSERT INTO shared.website_global_settings (id, active_theme_id)
     VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET active_theme_id = EXCLUDED.active_theme_id, updated_at = CURRENT_TIMESTAMP`,
    [themeId]
  );
}
