const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const getAllSettings = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let queryText = 'SELECT * FROM settings WHERE 1=1';
  const params = [];

  if (category) {
    queryText += ' AND category = $1';
    params.push(category);
  }

  queryText += ' ORDER BY category, setting_key';

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length,
  });
});

const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const result = await query(
    'SELECT * FROM settings WHERE setting_key = $1',
    [key]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Setting not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

const createSetting = asyncHandler(async (req, res) => {
  const { setting_key, setting_value, category, description } = req.body;

  const result = await query(
    `INSERT INTO settings (setting_key, setting_value, category, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [setting_key, setting_value, category || null, description || null]
  );

  res.status(201).json({
    success: true,
    message: 'Setting created successfully',
    data: result.rows[0],
  });
});

const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { setting_value, category, description } = req.body;

  const result = await query(
    `UPDATE settings 
     SET setting_value = $1, category = $2, description = $3, updated_at = CURRENT_TIMESTAMP
     WHERE setting_key = $4
     RETURNING *`,
    [setting_value, category || null, description || null, key]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Setting not found');
  }

  res.json({
    success: true,
    message: 'Setting updated successfully',
    data: result.rows[0],
  });
});

const deleteSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const result = await query(
    'DELETE FROM settings WHERE setting_key = $1 RETURNING *',
    [key]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Setting not found');
  }

  res.json({
    success: true,
    message: 'Setting deleted successfully',
  });
});

const bulkUpdateSettings = asyncHandler(async (req, res) => {
  const settings = Array.isArray(req.body) ? req.body : req.body.settings;

  const results = [];
  for (const setting of settings) {
    const result = await query(
      `INSERT INTO settings (setting_key, setting_value, category, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, category = COALESCE($3, settings.category), updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [setting.key, setting.value, setting.category || null]
    );
    if (result.rows.length > 0) {
      results.push(result.rows[0]);
    }
  }

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: results,
    count: results.length,
  });
});

module.exports = {
  getAllSettings,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting,
  bulkUpdateSettings,
};
