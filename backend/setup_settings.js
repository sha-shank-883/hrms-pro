const { pool } = require('./src/config/database');

const setup = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared.website_settings (
        id SERIAL PRIMARY KEY, 
        hero_title VARCHAR(255), 
        hero_subtitle TEXT, 
        hero_image_url VARCHAR(255), 
        logo_url VARCHAR(255), 
        primary_color VARCHAR(50), 
        font_family VARCHAR(100), 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const res = await pool.query('SELECT count(*) FROM shared.website_settings');
    if (res.rows[0].count === '0') {
      await pool.query(`
        INSERT INTO shared.website_settings (hero_title, hero_subtitle, primary_color, font_family) 
        VALUES ('The complete HR software for growing companies.', 'Set your people free to do great work with the only HR software you''ll ever need.', '#16a34a', 'Inter')
      `);
    }
    console.log('Settings table created successfully');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
setup();
