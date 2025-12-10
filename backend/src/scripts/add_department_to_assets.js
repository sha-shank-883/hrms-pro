const { pool } = require('../config/database');

const addDepartmentToAssets = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Add department_id to assets table...');

        // Get all schemas
        const schemas = await client.query(
            "SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'"
        );

        for (const row of schemas.rows) {
            const schema = row.nspname;
            console.log(`Checking schema: ${schema}`);

            // Check if assets table exists
            const tableExists = await client.query(
                `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = $1 AND table_name = 'assets'
         )`,
                [schema]
            );

            if (tableExists.rows[0].exists) {
                console.log(`Assets table found in ${schema}. Adding department_id column...`);

                // Add department_id column if it doesn't exist
                await client.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_schema = '${schema}' 
                           AND table_name = 'assets' 
                           AND column_name = 'department_id') THEN
              ALTER TABLE "${schema}".assets 
              ADD COLUMN department_id INTEGER REFERENCES "${schema}".departments(department_id) ON DELETE SET NULL;
              RAISE NOTICE 'Added department_id to ${schema}.assets';
            ELSE
              RAISE NOTICE 'department_id already exists in ${schema}.assets';
            END IF;
          END $$;
        `);
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
};

addDepartmentToAssets();
