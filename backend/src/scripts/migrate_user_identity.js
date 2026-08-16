require('dotenv').config();
const { pool } = require('../config/database');

async function migrateUserIdentity() {
  console.log('=== Migrating Tenant Users Table (Adding User Identity Columns) ===\n');

  const tenantsRes = await pool.query('SELECT tenant_id FROM shared.tenants');
  console.log(`Found ${tenantsRes.rows.length} tenant schemas to migrate...`);

  for (const tenant of tenantsRes.rows) {
    const tenantId = tenant.tenant_id;
    try {
      await pool.query(`ALTER TABLE "${tenantId}".users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);`);
      await pool.query(`ALTER TABLE "${tenantId}".users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);`);
      await pool.query(`ALTER TABLE "${tenantId}".users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
      await pool.query(`ALTER TABLE "${tenantId}".users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);`);
      
      // Also ensure employees.user_id has ON DELETE SET NULL if not already
      try {
        // Populate existing user names from employees or tenants if empty
        await pool.query(`
          UPDATE "${tenantId}".users u
          SET 
            first_name = COALESCE(u.first_name, e.first_name, 'Admin'),
            last_name = COALESCE(u.last_name, e.last_name, 'User'),
            phone = COALESCE(u.phone, e.phone)
          FROM "${tenantId}".employees e
          WHERE u.user_id = e.user_id AND (u.first_name IS NULL OR u.last_name IS NULL)
        `);
      } catch (_) {}

      console.log(`✅ Migrated schema: ${tenantId}`);
    } catch (err) {
      console.warn(`⚠️ Skipped schema ${tenantId}: ${err.message}`);
    }
  }

  console.log('\n=== Migration completed successfully! ===');
  process.exit(0);
}

migrateUserIdentity().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
