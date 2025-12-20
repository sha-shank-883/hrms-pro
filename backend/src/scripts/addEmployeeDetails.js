
const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration to add employee details columns...');

        // Get all tenants
        const tenantsResult = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsResult.rows;

        console.log(`Found ${tenants.length} tenants. Processing...`);

        for (const tenant of tenants) {
            const { tenant_id } = tenant;
            console.log(`Processing tenant: ${tenant_id}`);

            // Switch to tenant schema to ensure we are targeting correct tables
            await client.query(`SET search_path TO "${tenant_id}", public`);

            // Add columns if they don't exist
            await client.query(`
        DO $$
        BEGIN
            -- Add reporting_manager_id
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${tenant_id}' AND table_name = 'employees' AND column_name = 'reporting_manager_id') THEN
                ALTER TABLE employees ADD COLUMN reporting_manager_id INTEGER REFERENCES employees(employee_id);
            END IF;

            -- Add social_links
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${tenant_id}' AND table_name = 'employees' AND column_name = 'social_links') THEN
                ALTER TABLE employees ADD COLUMN social_links JSONB DEFAULT '{}';
            END IF;

            -- Add education
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${tenant_id}' AND table_name = 'employees' AND column_name = 'education') THEN
                ALTER TABLE employees ADD COLUMN education JSONB DEFAULT '[]';
            END IF;

             -- Add experience
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${tenant_id}' AND table_name = 'employees' AND column_name = 'experience') THEN
                ALTER TABLE employees ADD COLUMN experience JSONB DEFAULT '[]';
            END IF;

            -- Add about_me
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${tenant_id}' AND table_name = 'employees' AND column_name = 'about_me') THEN
                ALTER TABLE employees ADD COLUMN about_me TEXT;
            END IF;
        END $$;
      `);

            console.log(`Updated schema for tenant: ${tenant_id}`);
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
