const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Migration: Add Reset Columns...');

        // 1. Get all tenants
        const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsRes.rows;

        // 2. Read migration SQL
        const migrationPath = path.join(__dirname, '../config/migrations/add_reset_columns.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        // 3. Apply to each tenant
        for (const tenant of tenants) {
            console.log(`Applying to ${tenant.tenant_id}...`);
            try {
                await client.query(`SET search_path TO "${tenant.tenant_id}"`);
                await client.query(migrationSql);
                console.log(`   ✓ Success`);
            } catch (err) {
                console.error(`   ❌ Failed for ${tenant.tenant_id}:`, err.message);
            }
        }

        console.log('✅ Migration Complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        pool.end();
    }
};

runMigration();
