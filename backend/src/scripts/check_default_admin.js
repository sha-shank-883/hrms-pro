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

async function checkAdmins() {
    const client = await pool.connect();
    try {
        console.log('Checking for default admin in tenants...');

        const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsRes.rows.map(t => t.tenant_id);

        if (!tenants.includes('tenant_default')) tenants.push('tenant_default');

        for (const tenantId of tenants) {
            try {
                // Check if schema exists
                const schemaCheck = await client.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [tenantId]);
                if (schemaCheck.rows.length === 0) continue;

                await client.query(`SET search_path TO "${tenantId}"`);
                const res = await client.query(`SELECT email, role FROM users WHERE email = 'admin@hrmspro.com'`);

                if (res.rows.length > 0) {
                    console.log(`[${tenantId}] ⚠️  Default admin found!`);
                } else {
                    console.log(`[${tenantId}] ✓ No default admin found.`);
                }
            } catch (err) {
                console.error(`Error checking ${tenantId}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAdmins();
