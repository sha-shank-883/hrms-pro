const { pool } = require('../config/database');

async function addContactInfoToSettings() {
  const client = await pool.connect();
  try {
    console.log('Adding contact_info and social_links to shared.website_settings...');

    await client.query(`
      ALTER TABLE shared.website_settings
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT 'hello@hrmspro.online',
      ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) DEFAULT '+1 (555) 123-4567',
      ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT '100 Tech Lane, Suite 200, San Francisco, CA 94105',
      ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) DEFAULT 'HRMS Pro',
      ADD COLUMN IF NOT EXISTS tagline VARCHAR(500) DEFAULT 'Modern HR management platform for growing businesses.',
      ADD COLUMN IF NOT EXISTS copyright_text VARCHAR(500) DEFAULT 'All rights reserved.'
    `);
    console.log('✅ Added contact info columns');

    // Update existing row with defaults if it has no values
    await client.query(`
      UPDATE shared.website_settings
      SET contact_email = COALESCE(NULLIF(contact_email, ''), 'hello@hrmspro.online'),
          contact_phone = COALESCE(NULLIF(contact_phone, ''), '+1 (555) 123-4567'),
          social_links = CASE
            WHEN social_links IS NULL OR social_links = '[]'::jsonb
            THEN '[{"platform":"linkedin","url":"https://linkedin.com/company/hrmspro","label":"LinkedIn"},{"platform":"twitter","url":"https://twitter.com/hrmspro","label":"Twitter"},{"platform":"github","url":"https://github.com/hrmspro","label":"GitHub"},{"platform":"youtube","url":"https://youtube.com/@hrmspro","label":"YouTube"}]'::jsonb
            ELSE social_links
          END
    `);

    console.log('✅ Set default values');
    console.log('Migration complete.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

addContactInfoToSettings();
