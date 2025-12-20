const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

async function debugDatabase() {
    const client = await pool.connect();
    try {
        console.log('--- Database Verification: Public vs Tenant_Default ---');
        console.log('DB Name:', process.env.DB_NAME);

        const tables = ['users', 'employees', 'attendance', 'leave_requests', 'tasks', 'payroll'];

        console.log('\\nTable             | Public Count | Tenant_Default Count');
        console.log('------------------|--------------|---------------------');

        for (const table of tables) {
            // Count Public
            await client.query('SET search_path TO public');
            const publicRes = await client.query(`SELECT COUNT(*) FROM ${table}`);
            const publicCount = publicRes.rows[0].count;

            // Count Tenant
            await client.query('SET search_path TO "tenant_default", public');
            const tenantRes = await client.query(`SELECT COUNT(*) FROM ${table}`);
            const tenantCount = tenantRes.rows[0].count;

            console.log(`${table.padEnd(17)} | ${publicCount.padEnd(12)} | ${tenantCount}`);
        }

        console.log('\\n-----------------------------------------------------');

    } catch (err) {
        console.error('Debug script error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

debugDatabase();
