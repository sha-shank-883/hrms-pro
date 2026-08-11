const { pool } = require('../config/database');

async function upgradeCmsPages() {
  console.log('🔄 Upgrading shared.cms_pages with new columns...');
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE shared.cms_pages
      ADD COLUMN IF NOT EXISTS layout_template VARCHAR(50) DEFAULT 'default',
      ADD COLUMN IF NOT EXISTS custom_css TEXT,
      ADD COLUMN IF NOT EXISTS custom_js TEXT
    `);

    await client.query(`
      UPDATE shared.cms_pages
      SET layout_template = COALESCE(layout_template, 'default')
      WHERE layout_template IS NULL
    `);

    console.log('✅ cms_pages table upgraded: layout_template, custom_css, custom_js columns added.');
  } catch (error) {
    console.error('❌ Error upgrading cms_pages table:', error);
  } finally {
    client.release();
    process.exit();
  }
}

upgradeCmsPages();
