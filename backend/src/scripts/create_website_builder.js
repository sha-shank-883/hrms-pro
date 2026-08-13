const { pool } = require('../config/database');

async function run() {
  console.log('Ensuring website builder tables exist in shared schema...');

  // 1. Website Pages
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared.website_pages (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(512) NOT NULL,
      page_type VARCHAR(50) DEFAULT 'custom',
      is_published BOOLEAN DEFAULT true,
      is_homepage BOOLEAN DEFAULT false,
      layout_template VARCHAR(50) DEFAULT 'default',
      meta_title VARCHAR(255),
      meta_description TEXT,
      meta_keywords TEXT,
      open_graph_image TEXT,
      custom_css TEXT,
      custom_js TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ shared.website_pages');

  // 2. Website Sections
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared.website_sections (
      id SERIAL PRIMARY KEY,
      page_id INTEGER REFERENCES shared.website_pages(id) ON DELETE CASCADE,
      section_type VARCHAR(100) NOT NULL,
      section_name VARCHAR(255),
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_visible BOOLEAN DEFAULT true,
      settings JSONB NOT NULL DEFAULT '{}',
      custom_class VARCHAR(255),
      custom_id VARCHAR(255),
      background JSONB DEFAULT '{}',
      animation JSONB DEFAULT '{"type":"fadeInUp","duration":0.6}',
      visibility_rules JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_sections_page_id ON shared.website_sections(page_id);
    CREATE INDEX IF NOT EXISTS idx_sections_sort ON shared.website_sections(page_id, sort_order);
  `);
  console.log('✓ shared.website_sections');

  // 3. Website Media Library
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared.website_media (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100),
      file_size INTEGER,
      alt_text TEXT,
      width INTEGER,
      height INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ shared.website_media');

  // 4. Website Global Settings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared.website_global_settings (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255) DEFAULT 'HRMS Pro',
      tagline TEXT DEFAULT 'Modern HR platform for growing businesses.',
      logo_url TEXT,
      favicon_url TEXT,
      primary_color VARCHAR(50) DEFAULT '#6366f1',
      secondary_color VARCHAR(50) DEFAULT '#8b5cf6',
      font_family VARCHAR(100) DEFAULT 'Inter',
      theme_mode VARCHAR(20) DEFAULT 'light',
      layout_width VARCHAR(20) DEFAULT 'boxed',
      social_links JSONB DEFAULT '[]',
      contact_email VARCHAR(255),
      contact_phone VARCHAR(255),
      contact_address TEXT,
      header_config JSONB DEFAULT '{"sticky":true,"transparent":false,"style":"default"}',
      footer_config JSONB DEFAULT '{"columns":[],"bottomBar":true,"style":"dark"}',
      announcement_bar JSONB DEFAULT '{"text":"","isActive":false,"dismissible":true}',
      cookie_consent JSONB DEFAULT '{"enabled":false,"text":"","buttonText":"Accept"}',
      custom_css TEXT,
      custom_js TEXT,
      google_analytics_id VARCHAR(100),
      google_tag_manager_id VARCHAR(100),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ shared.website_global_settings');

  // Insert default global settings row
  await pool.query(`INSERT INTO shared.website_global_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);

  console.log('All website builder tables created successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
