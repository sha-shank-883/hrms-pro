const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const updateSchema = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting schema update...');

    // Get all schemas (public and tenant schemas)
    // Assuming tenant schemas follow a pattern or we just want to update all schemas that have a tasks table
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);

    const schemas = schemasRes.rows.map(r => r.schema_name);
    console.log('Found schemas:', schemas);

    for (const schema of schemas) {
      console.log(`Checking schema: ${schema}`);

      // Check if tasks table exists in this schema
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'tasks'
      `, [schema]);

      if (tableCheck.rows.length > 0) {
        console.log(`Found tasks table in ${schema}. Checking for category column...`);

        // Check if category column exists
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = 'tasks' AND column_name = 'category'
        `, [schema]);

        if (columnCheck.rows.length === 0) {
          console.log(`Adding category column to ${schema}.tasks...`);
          await client.query(`
            ALTER TABLE "${schema}".tasks 
            ADD COLUMN category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'onboarding', 'offboarding'))
          `);
          console.log(`Category column added to ${schema}.tasks successfully.`);
        } else {
          console.log(`Category column already exists in ${schema}.tasks.`);
        }
      } else {
        console.log(`No tasks table in ${schema}. Skipping.`);
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
