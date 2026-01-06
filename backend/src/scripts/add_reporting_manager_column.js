const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const updateSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting schema update for reporting_manager_id...');

        // Get all schemas (public and tenant schemas)
        const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);

        const schemas = schemasRes.rows.map(r => r.schema_name);
        console.log('Found schemas:', schemas);

        for (const schema of schemas) {
            console.log(`Checking schema: ${schema}`);

            // Check if employees table exists in this schema
            const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'employees'
      `, [schema]);

            if (tableCheck.rows.length > 0) {
                console.log(`Found employees table in ${schema}. Checking for reporting_manager_id column...`);

                // Check if reporting_manager_id column exists
                const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = 'employees' AND column_name = 'reporting_manager_id'
        `, [schema]);

                if (columnCheck.rows.length === 0) {
                    console.log(`Adding reporting_manager_id column to ${schema}.employees...`);
                    await client.query(`
            ALTER TABLE "${schema}".employees 
            ADD COLUMN reporting_manager_id INTEGER REFERENCES "${schema}".employees(employee_id)
          `);
                    console.log(`reporting_manager_id column added to ${schema}.employees successfully.`);
                } else {
                    console.log(`reporting_manager_id column already exists in ${schema}.employees.`);
                }
            } else {
                console.log(`No employees table in ${schema}. Skipping.`);
            }
        }

        console.log('Schema update completed.');
        process.exit(0);
    } catch (error) {
        console.error('Schema update failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

updateSchema();
