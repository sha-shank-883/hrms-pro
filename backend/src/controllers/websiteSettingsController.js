const { pool } = require('../config/database');

const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shared.website_settings LIMIT 1');
    if (result.rows.length === 0) {
      // Return default settings instead of 404 to avoid frontend breakage
      return res.json({ 
        success: true, 
        data: {
          primary_color: '#16a34a',
          font_family: 'Inter',
          header_links: [],
          footer_columns: [],
          sections: []
        } 
      });
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

    // Check if record exists
    const checkResult = await pool.query('SELECT id FROM shared.website_settings LIMIT 1');
    
    let result;
    if (checkResult.rows.length === 0) {
      // INSERT if table is empty
      const columns = updateFields.map(f => f.split(' = ')[0]);
      const placeholders = columns.map((_, i) => `$${i+1}`);
      const insertQuery = `
        INSERT INTO shared.website_settings (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      result = await pool.query(insertQuery, queryParams);
    } else {
      // UPDATE existing
      const updateQuery = `
        UPDATE shared.website_settings 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${index}
        RETURNING *
      `;
      result = await pool.query(updateQuery, [...queryParams, checkResult.rows[0].id]);
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
