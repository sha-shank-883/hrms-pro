const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

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
        

        // 1. Get all tenants
        const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsRes.rows;

        

        for (const tenant of tenants) {
            const tenantId = tenant.tenant_id;
            

            try {
                // Set search path to tenant schema
                await client.query(`SET search_path TO "${tenantId}"`);

                // Add columns if they don't exist
                await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
          ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT false
        `);

                
            } catch (err) {
                console.error(`X Failed to migrate tenant ${tenantId}:`, err.message);
            }
        }

        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
