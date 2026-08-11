const { pool } = require('../config/database');

async function upgradeWebsiteSettings() {
  console.log('🔄 Upgrading shared.website_settings with custom_css, custom_js columns...');
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE shared.website_settings
      ADD COLUMN IF NOT EXISTS custom_css TEXT,
      ADD COLUMN IF NOT EXISTS custom_js TEXT
    `);

    console.log('✅ website_settings table upgraded: custom_css, custom_js columns added.');
  } catch (error) {
    console.error('❌ Error upgrading website_settings table:', error);
  } finally {
    client.release();
    process.exit();
  }
}

upgradeWebsiteSettings();
