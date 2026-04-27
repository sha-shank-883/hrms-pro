const { pool } = require('../config/database');

async function expandWebsiteSettings() {
  console.log('🔄 Checking website_settings for new columns...');
  const client = await pool.connect();
  try {
    const columnsToAdd = [
      // Visibility Toggles
      { name: 'show_social_proof', type: 'BOOLEAN', default: 'true' },
      { name: 'show_deep_dive', type: 'BOOLEAN', default: 'true' },
      { name: 'show_time_tracking', type: 'BOOLEAN', default: 'true' },
      { name: 'show_grid_features', type: 'BOOLEAN', default: 'true' },
      { name: 'show_testimonials', type: 'BOOLEAN', default: 'true' },
      { name: 'show_cta', type: 'BOOLEAN', default: 'true' },
      
      // Text Content
      { name: 'social_proof_title', type: 'VARCHAR(255)', default: "'Trusted by over 30,000 companies worldwide'" },
      
      { name: 'deep_dive_title', type: 'VARCHAR(255)', default: "'Everything you need, perfectly organized.'" },
      { name: 'deep_dive_subtitle', type: 'TEXT', default: "'Say goodbye to messy spreadsheets and scattered documents. HRMS Pro brings all your critical employee data into one secure, centralized, and beautifully designed interface.'" },
      
      { name: 'time_tracking_title', type: 'VARCHAR(255)', default: "'Time tracking that actually works.'" },
      { name: 'time_tracking_subtitle', type: 'TEXT', default: "'Empower your team with intuitive clock-ins, seamless PTO requests, and dynamic shift rostering. Approvals are just one click away for managers.'" },
      
      { name: 'grid_features_title', type: 'VARCHAR(255)', default: "'A complete suite of modules'" },
      { name: 'grid_features_subtitle', type: 'TEXT', default: "'Everything you need to manage the entire employee lifecycle without leaving the platform.'" },
      
      { name: 'testimonial_text', type: 'TEXT', default: "'Before HRMS Pro, we used 4 different tools for payroll, time off, reviews, and documents. Consolidating everything into one platform saved our HR team 20 hours a week.'" },
      { name: 'testimonial_author', type: 'VARCHAR(100)', default: "'Sarah Jenkins'" },
      { name: 'testimonial_role', type: 'VARCHAR(100)', default: "'VP of People, GlobalTech'" },
      
      { name: 'cta_title', type: 'VARCHAR(255)', default: "'Ready to transform your HR?'" },
      { name: 'cta_subtitle', type: 'TEXT', default: "'Join thousands of companies using HRMS Pro to streamline their HR processes and build better workplaces.'" }
    ];

    for (const col of columnsToAdd) {
      try {
        await client.query(`
          ALTER TABLE shared.website_settings 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default}
        `);
      } catch (colError) {
        console.error(`Error adding column ${col.name}:`, colError.message);
      }
    }

    console.log('✅ website_settings table successfully expanded with new layout columns.');

  } catch (error) {
    console.error('❌ Error expanding website_settings table:', error);
  } finally {
    client.release();
    process.exit();
  }
}

expandWebsiteSettings();
