const { pool } = require('../config/database');

async function migrateChatSchema() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running Comprehensive Chat Schema Migration across all tenant schemas...');

    // Get all tenant schemas
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public', 'shared')
    `);

    const schemas = schemasRes.rows.map(r => r.schema_name);
    console.log(`📡 Found ${schemas.length} tenant schemas:`, schemas.join(', '));

    for (const schema of schemas) {
      console.log(`📦 Updating schema: "${schema}"...`);

      // 1. Ensure chat_messages table exists and has all advanced columns
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".chat_messages (
          message_id SERIAL PRIMARY KEY,
          sender_id INTEGER REFERENCES "${schema}".users(user_id) ON DELETE CASCADE,
          receiver_id INTEGER REFERENCES "${schema}".users(user_id) ON DELETE SET NULL,
          channel_id INTEGER,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          read_at TIMESTAMP,
          attachment_url VARCHAR(1000),
          attachment_type VARCHAR(100),
          attachment_name VARCHAR(255),
          reply_to_id INTEGER,
          is_deleted BOOLEAN DEFAULT false,
          deleted_at TIMESTAMP,
          is_starred BOOLEAN DEFAULT false,
          message_type VARCHAR(50) DEFAULT 'text',
          call_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add columns if table already existed without them
      await client.query(`
        ALTER TABLE "${schema}".chat_messages 
        ADD COLUMN IF NOT EXISTS reply_to_id INTEGER,
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS channel_id INTEGER,
        ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text',
        ADD COLUMN IF NOT EXISTS call_data JSONB,
        ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(1000);
      `);

      // 2. Ensure message_reactions table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".message_reactions (
          reaction_id SERIAL PRIMARY KEY,
          message_id INTEGER REFERENCES "${schema}".chat_messages(message_id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES "${schema}".users(user_id) ON DELETE CASCADE,
          reaction VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id)
        );
      `);

      // 3. Ensure chat_channels table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".chat_channels (
          channel_id SERIAL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_private BOOLEAN DEFAULT false,
          created_by INTEGER REFERENCES "${schema}".users(user_id) ON DELETE SET NULL,
          avatar TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Ensure channel_id column exists if table was created with 'id'
      await client.query(`
        ALTER TABLE "${schema}".chat_channels 
        ADD COLUMN IF NOT EXISTS channel_id INTEGER,
        ADD COLUMN IF NOT EXISTS name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS created_by INTEGER,
        ADD COLUMN IF NOT EXISTS avatar TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);

      // 4. Ensure chat_channel_members table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".chat_channel_members (
          id SERIAL PRIMARY KEY,
          channel_id INTEGER,
          user_id INTEGER,
          role VARCHAR(50) DEFAULT 'member',
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add columns to chat_channel_members if needed
      await client.query(`
        ALTER TABLE "${schema}".chat_channel_members 
        ADD COLUMN IF NOT EXISTS channel_id INTEGER,
        ADD COLUMN IF NOT EXISTS user_id INTEGER,
        ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member',
        ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);

      // 5. Create Indexes for ultra-fast query responsiveness
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON "${schema}".chat_messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON "${schema}".chat_messages(receiver_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON "${schema}".chat_messages(channel_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON "${schema}".chat_messages(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_reactions_msg ON "${schema}".message_reactions(message_id);
      `);

      console.log(`   ✅ Schema "${schema}" chat tables and indexes fully verified!`);
    }

    console.log('🎉 Full Chat Database Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Chat migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateChatSchema().catch(console.error);
