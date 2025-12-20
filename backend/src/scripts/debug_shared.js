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

async function debugShared() {
    const client = await pool.connect();
    try {
        console.log('--- Checking Shared Schema ---');

        // Check if shared schema exists
        const schemaRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'shared'");
        if (schemaRes.rows.length === 0) {
            console.log('ERROR: Schema "shared" does not exist!');
        } else {
            console.log('Schema "shared" exists.');

            // Check if tenants table exists
            const tableRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'shared' AND table_name = 'tenants'");
            if (tableRes.rows.length === 0) {
                console.log('ERROR: Table "shared.tenants" does not exist!');
            } else {
                console.log('Table "shared.tenants" exists.');

                // Count tenants
                const countRes = await client.query('SELECT COUNT(*) FROM shared.tenants');
                console.log('Tenant count:', countRes.rows[0].count);

                // List tenants
                const rowsRes = await client.query('SELECT * FROM shared.tenants');
                console.log('Tenants:', rowsRes.rows);
            }
        }

    } catch (err) {
        console.error('Debug script error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

debugShared();
