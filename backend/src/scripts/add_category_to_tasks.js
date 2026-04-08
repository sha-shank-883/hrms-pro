const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const updateSchema = async () => {
  const client = await pool.connect();
  try {
    

    // Get all schemas (public and tenant schemas)
    // Assuming tenant schemas follow a pattern or we just want to update all schemas that have a tasks table
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);

    const schemas = schemasRes.rows.map(r => r.schema_name);
    

    for (const schema of schemas) {
      

      // Check if tasks table exists in this schema
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'tasks'
      `, [schema]);

      if (tableCheck.rows.length > 0) {
        

        // Check if category column exists
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = 'tasks' AND column_name = 'category'
        `, [schema]);

        if (columnCheck.rows.length === 0) {
          
          await client.query(`
            ALTER TABLE "${schema}".tasks 
            ADD COLUMN category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'onboarding', 'offboarding'))
          `);
          
        } else {
          
        }
      } else {
        
      }
    }

    
    process.exit(0);
  } catch (error) {
    console.error('Schema update failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

updateSchema();
