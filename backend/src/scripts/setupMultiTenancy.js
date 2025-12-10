const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const setupMultiTenancy = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Multi-Tenancy Setup...');

        // 1. Create Shared Schema
        console.log('Creating shared schema...');
        const sharedSchemaSql = fs.readFileSync(path.join(__dirname, '../config/shared_schema.sql'), 'utf8');
        await client.query(sharedSchemaSql);
        console.log('✅ Shared schema created.');

        // 2. Create Default Tenant (for migration)
        const defaultTenantId = 'tenant_default';
        console.log(`Creating default tenant: ${defaultTenantId}...`);

        // Insert into shared.tenants
        await client.query(`
      INSERT INTO shared.tenants (tenant_id, name, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (tenant_id) DO NOTHING
    `, [defaultTenantId, 'Default Company']);

        // 3. Create Schema for Default Tenant
        console.log(`Creating schema for ${defaultTenantId}...`);
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${defaultTenantId}"`);

        // 4. Run Tenant Schema SQL
        console.log(`Applying tables to ${defaultTenantId}...`);
        let tenantSchemaSql = fs.readFileSync(path.join(__dirname, '../config/tenant_schema.sql'), 'utf8');

        // Replace placeholder if we used one, but in Postgres we can just set search_path
        // But my tenant_schema.sql creates tables without schema prefix, so setting search_path is key.

        await client.query(`SET search_path TO "${defaultTenantId}"`);
        await client.query(tenantSchemaSql);

        console.log(`✅ Tenant ${defaultTenantId} setup complete.`);

        // 5. Create Default Admin User
        console.log('Creating default admin user...');
        await client.query(`
          INSERT INTO users (email, password_hash, role, first_name, last_name) 
          VALUES ('admin@hrmspro.com', '$2b$10$ZI0JCV5V.vT7b4sMK/FUA.xOFngGT9VQ64TK.ug4EvYwlda2FyTou', 'admin', 'Admin', 'User')
          ON CONFLICT (email) DO NOTHING
        `);
        console.log('✅ Default admin user created (if not exists).');

        // 5. (Optional) Migrate data from public to default tenant
        // This is complex and depends on if 'public' has data. 
        // For now, we assume we are setting up fresh or user will manually migrate.
        // But to be safe, let's warn.
        console.log('⚠️  NOTE: Existing data in "public" schema was NOT moved. You may need to migrate it manually.');

        console.log('✅ Multi-Tenancy Setup Completed Successfully!');
    } catch (error) {
        console.error('❌ Error setting up multi-tenancy:', error);
    } finally {
        client.release();
        pool.end();
    }
};

setupMultiTenancy();
