const { query } = require('../config/database');

// Get all settings
const getAllSettings = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message,
    });
  }
};

// Get single setting by key
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await query(
      'SELECT * FROM settings WHERE setting_key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message,
    });
  }
};

// Create setting
const createSetting = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setting',
      error: error.message,
    });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message,
    });
  }
};

// Delete setting
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await query(
      'DELETE FROM settings WHERE setting_key = $1 RETURNING *',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting',
      error: error.message,
    });
  }
};

// Bulk update settings
const bulkUpdateSettings = async (req, res) => {
  try {
    const settings = Array.isArray(req.body) ? req.body : req.body.settings; // Handle both array and object wrapper

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
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting,
  bulkUpdateSettings,
};
