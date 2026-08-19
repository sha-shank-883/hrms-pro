const { pool } = require('../config/database');

async function migrateSupportTables() {
  console.log('--- Migrating Support Module Tables ---');
  try {
    // 1. Get all active schemas
    const existingSchemasRes = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')"
    );
    const schemas = existingSchemasRes.rows.map(r => r.schema_name);
    console.log('Found schemas in database:', schemas);

    for (const s of schemas) {
      console.log(`\nEnsuring support tables exist in schema: "${s}"...`);
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${s}".faq_categories (
            category_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) NOT NULL,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".faq_articles (
            article_id SERIAL PRIMARY KEY,
            category_id INTEGER,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            keywords JSONB DEFAULT '[]'::jsonb,
            helpful_count INTEGER DEFAULT 0,
            not_helpful_count INTEGER DEFAULT 0,
            is_published BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".support_agents (
            agent_id SERIAL PRIMARY KEY,
            user_id INTEGER,
            is_available BOOLEAN DEFAULT true,
            max_concurrent_chats INTEGER DEFAULT 5,
            current_chats INTEGER DEFAULT 0,
            auto_assign BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".support_chats (
            chat_id SERIAL PRIMARY KEY,
            user_id INTEGER,
            agent_id INTEGER,
            status VARCHAR(50) DEFAULT 'active',
            source VARCHAR(50) DEFAULT 'widget',
            is_ai_active BOOLEAN DEFAULT true,
            ai_confidence DECIMAL(5,4),
            department VARCHAR(100),
            priority VARCHAR(20) DEFAULT 'normal',
            unread_count INTEGER DEFAULT 0,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            closed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".support_messages (
            message_id SERIAL PRIMARY KEY,
            chat_id INTEGER,
            sender_id INTEGER,
            sender_type VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            message_type VARCHAR(50) DEFAULT 'text',
            attachment_url VARCHAR(500),
            attachment_name VARCHAR(255),
            attachment_size INTEGER,
            metadata JSONB DEFAULT '{}'::jsonb,
            is_read BOOLEAN DEFAULT false,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".support_tickets (
            ticket_id SERIAL PRIMARY KEY,
            ticket_number VARCHAR(50) NOT NULL,
            user_id INTEGER,
            assigned_to INTEGER,
            chat_id INTEGER,
            subject VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            priority VARCHAR(20) DEFAULT 'normal',
            status VARCHAR(20) DEFAULT 'open',
            source VARCHAR(50) DEFAULT 'auto',
            resolution_notes TEXT,
            resolved_at TIMESTAMP,
            closed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".ticket_comments (
            comment_id SERIAL PRIMARY KEY,
            ticket_id INTEGER,
            user_id INTEGER,
            comment TEXT NOT NULL,
            is_internal BOOLEAN DEFAULT false,
            attachment_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".ai_logs (
            log_id SERIAL PRIMARY KEY,
            chat_id INTEGER,
            user_id INTEGER,
            query_text TEXT NOT NULL,
            response_text TEXT,
            provider VARCHAR(50) NOT NULL,
            confidence DECIMAL(5,4),
            is_faq_match BOOLEAN DEFAULT false,
            faq_article_id INTEGER,
            response_time_ms INTEGER,
            tokens_used INTEGER DEFAULT 0,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log(`  ✅ Successfully created/verified support tables in schema: "${s}"`);
      } catch (err) {
        console.error(`  ❌ Error migrating schema "${s}":`, err.message);
      }
    }

    console.log('\n--- Support Migration Complete ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSupportTables();
