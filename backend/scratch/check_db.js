const { pool } = require('../src/config/database');
async function check() {
  try {
    const s = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%settings%'");
    console.log('TABLES:', JSON.stringify(s.rows));
    
    // Check if website_settings exists in public schema too
    const p = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'website_settings')");
    console.log('PUBLIC_WEBSITE_SETTINGS_EXISTS:', p.rows[0].exists);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
check();
