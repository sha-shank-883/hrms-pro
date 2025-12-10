const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_port,
});

const addSSOColumns = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting SSO columns migration...');

        // 1. Get all schemas (tenants + public/shared)
        // We need to update 'users' table in all schemas where it exists.
        // Actually, 'users' exists in 'public' (if used for something? No, it's per tenant)
        // Wait, schema.sql creates 'users' in public? 
        // Yes, line 20 of schema.sql creates 'users'. This is likely for 'tenant_default' or shared users?
        // In our multi-tenancy, 'tenant_default' uses the public schema tables or its own?
        // Let's assume we need to update all schemas that have a 'users' table.

        const schemasRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `);

        const schemas = schemasRes.rows.map(r => r.schema_name);

        for (const schema of schemas) {
            console.log(`Checking schema: ${schema}`);

            // Check if users table exists in this schema
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = $1 AND table_name = 'users'
                )
            `, [schema]);

            if (tableExists.rows[0].exists) {
                console.log(`Updating users table in schema: ${schema}`);

                await client.query(`SET search_path TO "${schema}"`);

                // Add auth_provider column
                await client.query(`
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local'
                `);

                // Add auth_provider_id column
                await client.query(`
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS auth_provider_id VARCHAR(255)
                `);

                console.log(`Successfully updated ${schema}.users`);
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        pool.end();
    }
};

addSSOColumns();
