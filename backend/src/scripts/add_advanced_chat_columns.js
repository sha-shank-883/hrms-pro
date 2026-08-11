const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const updateSchemas = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting advanced chat features migration (Reply/Delete)...');

        const schemasRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public', 'shared')
        `);

        const schemas = schemasRes.rows.map(r => r.schema_name);
        console.log(`📡 Found ${schemas.length} tenant schemas`);

        for (const schema of schemas) {
            try {
                console.log(`📦 Updating schema: "${schema}"...`);

                // Check if message_id is the primary key or just id
                const pkRes = await client.query(`
                    SELECT column_name 
                    FROM information_schema.key_column_usage 
                    WHERE table_name = 'chat_messages' AND table_schema = '${schema}'
                    AND constraint_name LIKE '%pkey%'
                `);
                const pk = pkRes.rows[0]?.column_name || 'message_id';

                await client.query(`
                    ALTER TABLE "${schema}".chat_messages 
                    ADD COLUMN IF NOT EXISTS reply_to_id INTEGER,
                    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
                    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
                    ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false
                `);
                console.log(`   ✅ Columns added to chat_messages in "${schema}".`);

            } catch (err) {
                console.error(`   ❌ Failed to update schema "${schema}":`, err.message);
            }
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

updateSchemas();
