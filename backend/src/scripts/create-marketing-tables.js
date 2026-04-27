const { pool } = require('../config/database');

async function createMarketingTables() {
  const client = await pool.connect();
  try {
    console.log('Creating marketing tables in shared schema...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.cms_pages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        content_html TEXT,
        meta_title VARCHAR(255),
        meta_description TEXT,
        published_status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created shared.cms_pages');

    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.demo_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'provisioned',
        tenant_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created shared.demo_requests');

    console.log('Database setup complete.');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

createMarketingTables();
