const { pool } = require('../config/database');

const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shared.website_settings LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching website settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const validFields = [
      'hero_title', 'hero_subtitle', 'primary_color', 'font_family',
      'show_social_proof', 'show_deep_dive', 'show_time_tracking', 'show_grid_features', 'show_testimonials', 'show_cta',
      'social_proof_title', 'deep_dive_title', 'deep_dive_subtitle', 'time_tracking_title', 'time_tracking_subtitle',
      'grid_features_title', 'grid_features_subtitle', 'testimonial_text', 'testimonial_author', 'testimonial_role',
      'cta_title', 'cta_subtitle',
      'sections', 'header_links', 'footer_columns'
    ];

    let updateFields = [];
    let queryParams = [];
    let index = 1;

    for (const field of validFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = $${index++}`);
        queryParams.push(req.body[field]);
      }
    }

    // Handle files if uploaded via multer
    if (req.files) {
      if (req.files.hero_image) {
        // e.g., 'uploads/website/imagename.png'
        updateFields.push(`hero_image_url = $${index++}`);
        queryParams.push(`/uploads/website/${req.files.hero_image[0].filename}`);
      }
      if (req.files.logo) {
        updateFields.push(`logo_url = $${index++}`);
        queryParams.push(`/uploads/website/${req.files.logo[0].filename}`);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE shared.website_settings 
      SET ${updateFields.join(', ')} 
      WHERE id = (SELECT id FROM shared.website_settings LIMIT 1)
      RETURNING *
    `;

    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      // If table is empty for some reason, insert
      // We assume setup script already populated it
      return res.status(404).json({ success: false, message: 'Settings record not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating website settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
