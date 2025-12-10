const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting 2FA migration fix...');
        console.log(`DB User: ${process.env.DB_USER}`);
        console.log(`DB Host: ${process.env.DB_HOST}`);

        // 1. Get all tenants from shared.tenants
        const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
        let tenants = tenantsRes.rows.map(t => t.tenant_id);

        // 2. Explicitly add tenant_default if not present
        if (!tenants.includes('tenant_default')) {
            console.log('Adding tenant_default to migration list (not found in shared.tenants)');
            tenants.push('tenant_default');
        }

        console.log(`Found ${tenants.length} tenants to check:`, tenants);

        for (const tenantId of tenants) {
            console.log(`Processing tenant: ${tenantId}`);

            try {
                // Check if schema exists first
                const schemaCheck = await client.query(`
                    SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
                `, [tenantId]);

                if (schemaCheck.rows.length === 0) {
                    console.log(`⚠️ Schema ${tenantId} does not exist. Skipping.`);
                    continue;
                }

                // Set search path to tenant schema
                await client.query(`SET search_path TO "${tenantId}"`);

                // Add columns if they don't exist
                await client.query(`
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT false,
                    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
                `);

                console.log(`✓ Updated users table for ${tenantId}`);
            } catch (err) {
                console.error(`X Failed to migrate tenant ${tenantId}:`, err.message);
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
