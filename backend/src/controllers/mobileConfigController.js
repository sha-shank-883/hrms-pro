const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

/**
 * Get public app configurations
 * Used by mobile app before login
 */
const getPublicConfig = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT config_key, config_value FROM shared.app_configs WHERE is_public = true'
  );

  const config = {};
  result.rows.forEach(row => {
    config[row.config_key] = row.config_value;
  });

  res.json({
    success: true,
    data: config
  });
});

/**
 * Get all app configurations (Private)
 * Used by mobile app after login or by Super Admin
 */
const getAllConfigs = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT config_key, config_value, category, is_public FROM shared.app_configs ORDER BY category, config_key'
  );

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Update app configuration (Super Admin only)
 */
const updateConfig = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, category, is_public } = req.body;

  const result = await pool.query(
    `UPDATE shared.app_configs 
     SET config_value = $1, category = COALESCE($2, category), is_public = COALESCE($3, is_public), updated_at = CURRENT_TIMESTAMP
     WHERE config_key = $4
     RETURNING *`,
    [value, category, is_public, key]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Configuration key not found');
  }

  res.json({
    success: true,
    message: 'Configuration updated successfully',
    data: result.rows[0]
  });
});

module.exports = {
  getPublicConfig,
  getAllConfigs,
  updateConfig
};
