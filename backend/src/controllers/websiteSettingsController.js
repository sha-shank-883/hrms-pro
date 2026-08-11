const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const getSettings = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM shared.website_settings LIMIT 1');
  if (result.rows.length === 0) {
    return res.json({
      success: true,
      data: {
        primary_color: '#16a34a',
        font_family: 'Inter',
        header_links: [],
        footer_columns: [],
        sections: [],
        custom_css: '',
        custom_js: '',
        contact_email: 'hello@hrmspro.online',
        contact_phone: '+1 (555) 123-4567',
        contact_address: '100 Tech Lane, Suite 200, San Francisco, CA 94105',
        social_links: [],
        company_name: 'HRMS Pro',
        tagline: 'Modern HR management platform for growing businesses.',
        copyright_text: 'All rights reserved.',
        logo_url: '',
        hero_image_url: '',
        demo_headline: 'Try HRMS Pro free for 14 days',
        demo_subheadline: 'Get instant access to a fully-functional HRMS environment. No credit card required, no commitment.',
        demo_features: [{"text":"Instant auto-provisioning of your demo environment"},{"text":"Full access to all features including payroll and analytics"},{"text":"Pre-loaded sample data to explore immediately"},{"text":"Invite up to 5 team members to evaluate together"},{"text":"Free onboarding call with a product specialist"}],
        demo_success_title: 'Demo Request Received!',
        demo_success_message: 'Thank you for your interest! We are setting up your personalized demo environment. You will receive an email with your login credentials within the next 15 minutes.',
        demo_button_text: 'Start Free Trial',
        demo_badge: 'Get Started',
        newsletter_show: true,
        newsletter_headline: 'Stay ahead with HR insights. Get the latest guides and trends delivered weekly.',
        newsletter_placeholder: 'Enter your work email',
        newsletter_button: 'Subscribe',
        awards: [{"label":"Capterra Best Value 2026","icon":"star"},{"label":"G2 Leader HRMS 2026","icon":"star"},{"label":"Top Rated 4.9/5","icon":"star"},{"label":"SOC 2 Type II Certified","icon":"shield"}],
        badges: [{"label":"SOC 2 Type II","icon":"shield"},{"label":"GDPR Compliant","icon":"check"}],
        sign_in_label: 'Sign In',
        cta_label: 'Get a Demo',
      }
    });
  }
  res.json({ success: true, data: result.rows[0] });
});

const updateSettings = asyncHandler(async (req, res) => {
  const validFields = [
    'hero_title', 'hero_subtitle', 'primary_color', 'font_family',
    'show_social_proof', 'show_deep_dive', 'show_time_tracking', 'show_grid_features', 'show_testimonials', 'show_cta',
    'social_proof_title', 'deep_dive_title', 'deep_dive_subtitle', 'time_tracking_title', 'time_tracking_subtitle',
    'grid_features_title', 'grid_features_subtitle', 'testimonial_text', 'testimonial_author', 'testimonial_role',
    'cta_title', 'cta_subtitle',
    'sections', 'header_links', 'footer_columns',
    'contact_email', 'contact_phone', 'contact_address',
    'social_links', 'company_name', 'tagline', 'copyright_text',
    'custom_css', 'custom_js',
    'demo_headline', 'demo_subheadline', 'demo_features',
    'demo_success_title', 'demo_success_message', 'demo_button_text', 'demo_badge',
    'newsletter_show', 'newsletter_headline', 'newsletter_placeholder', 'newsletter_button',
    'awards', 'badges', 'sign_in_label', 'cta_label',
    'theme_mode', 'primary_gradient', 'glassmorphism_enabled'
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
    throw new ValidationError('No fields provided for update');
  }

  const checkResult = await pool.query('SELECT id FROM shared.website_settings LIMIT 1');

  let result;
  if (checkResult.rows.length === 0) {
    const columns = updateFields.map(f => f.split(' = ')[0]);
    const placeholders = columns.map((_, i) => `$${i+1}`);
    const insertQuery = `
      INSERT INTO shared.website_settings (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    result = await pool.query(insertQuery, queryParams);
  } else {
    const updateQuery = `
      UPDATE shared.website_settings
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *
    `;
    result = await pool.query(updateQuery, [...queryParams, checkResult.rows[0].id]);
  }

  res.json({ success: true, data: result.rows[0], message: 'Settings updated successfully' });
});

module.exports = {
  getSettings,
  updateSettings
};
