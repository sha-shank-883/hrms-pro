const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const updateSchemas = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting chat channels tables migration...');

        const schemasRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant\\_%'
        `);

        const schemas = schemasRes.rows.map(r => r.schema_name);
        console.log(`📡 Found ${schemas.length} tenant schemas: ${schemas.join(', ')}`);

        for (const schema of schemas) {
            try {
                console.log(`📦 Updating schema: "${schema}"...`);

                const tableCheck = await client.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = $1 AND table_name = 'users'
                `, [schema]);

                if (tableCheck.rows.length === 0) {
                    console.log(`   ⏭️ Skipping "${schema}" (No users table found).`);
                    continue;
                }

                // 1. Create chat_channels table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS "${schema}".chat_channels (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        type VARCHAR(50) DEFAULT 'group',
                        is_private BOOLEAN DEFAULT false,
                        created_by INTEGER REFERENCES "${schema}".users(user_id) ON DELETE SET NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                console.log(`   ✅ Table "chat_channels" checked/created.`);

                // 2. Create chat_participants table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS "${schema}".chat_participants (
                        channel_id INTEGER REFERENCES "${schema}".chat_channels(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES "${schema}".users(user_id) ON DELETE CASCADE,
                        role VARCHAR(50) DEFAULT 'member',
                        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (channel_id, user_id)
                    )
                `);
                console.log(`   ✅ Table "chat_participants" checked/created.`);

                // 3. Update chat_messages table
                const colCheck = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = $1 AND table_name = 'chat_messages' AND column_name = 'channel_id'
                `, [schema]);

                if (colCheck.rows.length === 0) {
                    await client.query(`
                        ALTER TABLE "${schema}".chat_messages 
                        ADD COLUMN channel_id INTEGER REFERENCES "${schema}".chat_channels(id) ON DELETE CASCADE
                    `);
                    console.log(`   ➕ Added column "channel_id" to chat_messages table.`);
                }
                
                try {
                    await client.query(`ALTER TABLE "${schema}".chat_messages ALTER COLUMN receiver_id DROP NOT NULL`);
                    console.log(`   🔄 Made receiver_id nullable in chat_messages.`);
                } catch (e) {
                    // Ignore if already nullable
                }

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
