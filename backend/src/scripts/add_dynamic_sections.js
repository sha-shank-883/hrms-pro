const { pool } = require('../config/database');

async function addDynamicSections() {
  console.log('🔄 Checking website_settings for dynamic JSONB columns...');
  const client = await pool.connect();
  try {
    const defaultHeaderLinks = JSON.stringify([
      { id: "h1", label: "Products", url: "/#features", isButton: false },
      { id: "h2", label: "Pricing", url: "/pricing", isButton: false }
    ]);

    const defaultFooterColumns = JSON.stringify([
      {
        id: "fc1",
        title: "Product",
        links: [
          { id: "fl1", label: "HR Data", url: "/#features" },
          { id: "fl2", label: "Payroll", url: "/#features" },
          { id: "fl3", label: "Time Tracking", url: "/#features" }
        ]
      },
      {
        id: "fc2",
        title: "Company",
        links: [
          { id: "fl4", label: "About Us", url: "/about-us" },
          { id: "fl5", label: "Contact", url: "/contact" }
        ]
      },
      {
        id: "fc3",
        title: "Legal",
        links: [
          { id: "fl6", label: "Privacy Policy", url: "/privacy-policy" },
          { id: "fl7", label: "Terms of Service", url: "/terms-of-service" }
        ]
      }
    ]);

    const defaultSections = JSON.stringify([
      { id: "1", type: "Hero", title: "The complete HR software <br class=\"hidden md:block\"/><span class=\"text-primary-500\">for growing companies.</span>", subtitle: "Set your people free to do great work with the only HR software you'll ever need. Manage employee data, payroll, time off, and performance in one beautiful, automated platform." },
      { id: "2", type: "SocialProof", title: "Trusted by over 30,000 companies worldwide" },
      { id: "3", type: "DeepDive", title: "Everything you need, <br/><span class=\"text-primary-500\">perfectly organized.</span>", subtitle: "Say goodbye to messy spreadsheets and scattered documents. HRMS Pro brings all your critical employee data into one secure, centralized, and beautifully designed interface." },
      { id: "4", type: "TimeTracking", title: "Time tracking that <br/><span class=\"text-primary-400\">actually works.</span>", subtitle: "Empower your team with intuitive clock-ins, seamless PTO requests, and dynamic shift rostering. Approvals are just one click away for managers." },
      { id: "5", type: "GridFeatures", title: "A complete suite of modules", subtitle: "Everything you need to manage the entire employee lifecycle without leaving the platform." },
      { id: "6", type: "Testimonial", text: "Before HRMS Pro, we used 4 different tools for payroll, time off, reviews, and documents. Consolidating everything into one platform saved our HR team 20 hours a week.", author: "Sarah Jenkins", role: "VP of People, GlobalTech" },
      { id: "7", type: "CTA", title: "Ready to transform your HR?", subtitle: "Join thousands of companies using HRMS Pro to streamline their HR processes and build better workplaces." }
    ]);

    await client.query(`
      ALTER TABLE shared.website_settings 
      ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '${defaultSections.replace(/'/g, "''")}'::jsonb,
      ADD COLUMN IF NOT EXISTS header_links JSONB DEFAULT '${defaultHeaderLinks.replace(/'/g, "''")}'::jsonb,
      ADD COLUMN IF NOT EXISTS footer_columns JSONB DEFAULT '${defaultFooterColumns.replace(/'/g, "''")}'::jsonb
    `);

    // Ensure existing rows are populated with defaults if they are null
    await client.query(`
      UPDATE shared.website_settings 
      SET 
        sections = COALESCE(sections, '${defaultSections.replace(/'/g, "''")}'::jsonb),
        header_links = COALESCE(header_links, '${defaultHeaderLinks.replace(/'/g, "''")}'::jsonb),
        footer_columns = COALESCE(footer_columns, '${defaultFooterColumns.replace(/'/g, "''")}'::jsonb)
    `);

    console.log('✅ website_settings table successfully expanded with JSONB sections, header, and footer columns.');

  } catch (error) {
    console.error('❌ Error expanding website_settings table:', error);
  } finally {
    client.release();
    process.exit();
  }
}

addDynamicSections();
