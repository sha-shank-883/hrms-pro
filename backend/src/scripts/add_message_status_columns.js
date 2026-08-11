const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const updateSchemas = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting message status columns migration...');

        const schemasRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public', 'shared')
        `);

        const schemas = schemasRes.rows.map(r => r.schema_name);
        console.log(`📡 Found ${schemas.length} tenant schemas: ${schemas.join(', ')}`);

        for (const schema of schemas) {
            try {
                console.log(`📦 Updating schema: "${schema}"...`);

                await client.query(`
                    ALTER TABLE "${schema}".chat_messages 
                    ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT false,
                    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP
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
