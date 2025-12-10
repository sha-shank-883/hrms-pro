const { pool } = require('../config/database');

const addAuditLogsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Create audit_logs table...');

        // Get all schemas
        const schemas = await client.query(
            "SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'"
        );

        for (const row of schemas.rows) {
            const schema = row.nspname;
            console.log(`Checking schema: ${schema}`);

            // Check if users table exists
            const usersTableExists = await client.query(
                `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = $1 AND table_name = 'users'
         )`,
                [schema]
            );

            if (!usersTableExists.rows[0].exists) {
                console.log(`Skipping schema ${schema}: users table not found.`);
                continue;
            }

            // Create audit_logs table
            await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".audit_logs (
          log_id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES "${schema}".users(user_id) ON DELETE SET NULL,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100),
          entity_id INTEGER,
          details JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            // Create indexes
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_user ON "${schema}".audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON "${schema}".audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_entity ON "${schema}".audit_logs(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_date ON "${schema}".audit_logs(created_at);
      `);

            console.log(`Created/Verified audit_logs table in ${schema}`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
};

addAuditLogsTable();
