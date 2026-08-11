const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    const tenants = await client.query('SELECT tenant_id FROM shared.tenants');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'src/config/support_schema.sql'), 'utf8');
    const statements = sql.split(';').filter(s => s.trim().length > 0).map(s => s.trim() + ';');

    for (const tenant of tenants.rows) {
      const tId = tenant.tenant_id;
      console.log('Migrating tenant:', tId);
      await client.query('SET search_path TO "' + tId + '"');

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (e) {
          if (e.code === '42P07' || e.message.includes('already exists')) {
            // skip duplicates
          } else {
            console.error('  Error in', tId + ':', e.message.substring(0, 100));
          }
        }
      }
      console.log('  Completed');
    }

    console.log('\nSupport schema migration completed for ' + tenants.rows.length + ' tenants');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
