const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

module.exports = {
  // ───── LIST (admin) ─────
  getAllLabels: asyncHandler(async (req, res) => {
    const { namespace, search } = req.query;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (namespace) {
      conditions.push(`namespace = $${idx++}`);
      values.push(namespace);
    }
    if (search) {
      conditions.push(`(label_key ILIKE $${idx} OR label_value ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT id, namespace, label_key, label_value, description, updated_at
       FROM shared.website_labels ${where} ORDER BY namespace ASC, label_key ASC LIMIT 1000`,
      values
    );
    res.json({ success: true, data: result.rows });
  }),

  getLabelById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, namespace, label_key, label_value, description FROM shared.website_labels WHERE id = $1`, [id]
    );
    if (result.rows.length === 0) throw new NotFoundError('Label not found.');
    res.json({ success: true, data: result.rows[0] });
  }),

  createLabel: asyncHandler(async (req, res) => {
    const { namespace, label_key, label_value, description } = req.body;
    if (!namespace || !namespace.trim()) throw new ValidationError('Namespace is required.');
    if (!label_key || !label_key.trim()) throw new ValidationError('Label key is required.');
    if (label_value === undefined || label_value === null) throw new ValidationError('Label value is required.');

    const dup = await pool.query(
      `SELECT id FROM shared.website_labels WHERE namespace = $1 AND label_key = $2`,
      [namespace.trim(), label_key.trim()]
    );
    if (dup.rows.length > 0) throw new ConflictError('Label already exists for this namespace/key.');

    const result = await pool.query(
      `INSERT INTO shared.website_labels (namespace, label_key, label_value, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [namespace.trim(), label_key.trim(), String(label_value), description || '']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Label created.' });
  }),

  updateLabel: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { namespace, label_key, label_value, description } = req.body;

    const existing = await pool.query(`SELECT id FROM shared.website_labels WHERE id = $1`, [id]);
    if (existing.rows.length === 0) throw new NotFoundError('Label not found.');

    const fields = []; const values = []; let idx = 1;
    if (namespace !== undefined) {
      if (!namespace.trim()) throw new ValidationError('Namespace cannot be empty.');
      fields.push(`namespace = $${idx++}`); values.push(namespace.trim());
    }
    if (label_key !== undefined) {
      if (!label_key.trim()) throw new ValidationError('Label key cannot be empty.');
      fields.push(`label_key = $${idx++}`); values.push(label_key.trim());
    }
    if (label_value !== undefined) {
      fields.push(`label_value = $${idx++}`); values.push(String(label_value));
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`); values.push(description);
    }

    if (namespace !== undefined || label_key !== undefined) {
      const dup = await pool.query(
        `SELECT id FROM shared.website_labels WHERE namespace = $1 AND label_key = $2 AND id != $3`,
        [namespace?.trim() ?? existing.rows[0].namespace, label_key?.trim() ?? existing.rows[0].label_key, id]
      );
      if (dup.rows.length > 0) throw new ConflictError('Label already exists for this namespace/key.');
    }

    if (fields.length === 0) throw new ValidationError('No fields to update.');
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE shared.website_labels SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    res.json({ success: true, data: result.rows[0], message: 'Label updated.' });
  }),

  bulkUpdateLabels: asyncHandler(async (req, res) => {
    const { labels } = req.body;
    if (!Array.isArray(labels) || labels.length === 0) throw new ValidationError('labels must be a non-empty array.');
    if (labels.length > 500) throw new ValidationError('Too many labels in one request (max 500).');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let updated = 0;
      for (const item of labels) {
        const { id, namespace, label_key, label_value, description } = item;
        if (id) {
          await client.query(
            `UPDATE shared.website_labels SET label_value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [String(label_value ?? ''), description ?? null, id]
          );
        } else if (namespace && label_key) {
          await client.query(
            `INSERT INTO shared.website_labels (namespace, label_key, label_value, description)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (namespace, label_key) DO UPDATE SET label_value = EXCLUDED.label_value, description = COALESCE(EXCLUDED.description, shared.website_labels.description), updated_at = CURRENT_TIMESTAMP`,
            [namespace.trim(), label_key.trim(), String(label_value ?? ''), description || null]
          );
        } else {
          throw new ValidationError('Each label requires either an id or namespace + label_key.');
        }
        updated++;
      }
      await client.query('COMMIT');
      res.json({ success: true, message: `${updated} label(s) saved.` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  deleteLabel: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM shared.website_labels WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) throw new NotFoundError('Label not found.');
    res.json({ success: true, message: 'Label deleted.' });
  }),

  // ───── PUBLIC ─────
  getPublicLabels: asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT namespace, label_key, label_value FROM shared.website_labels ORDER BY namespace ASC, label_key ASC`
    );
    const map = {};
    for (const row of result.rows) {
      map[`${row.namespace}.${row.label_key}`] = row.label_value;
    }
    res.json({ success: true, data: map });
  }),
};
