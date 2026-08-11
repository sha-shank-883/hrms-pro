const { pool } = require('../config/database');

async function createBlogPostsTable() {
  const client = await pool.connect();
  try {
    console.log('Creating blog_posts table in shared schema...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.blog_posts (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT,
        content_html TEXT NOT NULL,
        category VARCHAR(100),
        tags JSONB DEFAULT '[]'::jsonb,
        author_name VARCHAR(255) DEFAULT 'HRMS Pro',
        author_role VARCHAR(255) DEFAULT 'Team',
        author_image VARCHAR(500),
        image_url VARCHAR(500),
        featured BOOLEAN DEFAULT false,
        published BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        meta_title VARCHAR(500),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created shared.blog_posts');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON shared.blog_posts(slug);
    `);
    console.log('✅ Created index on slug');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON shared.blog_posts(published);
    `);
    console.log('✅ Created index on published');

    console.log('Blog posts setup complete.');
  } catch (err) {
    console.error('Error creating table:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

createBlogPostsTable();
