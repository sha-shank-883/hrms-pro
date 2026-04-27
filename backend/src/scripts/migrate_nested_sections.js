const { pool } = require('../config/database');

async function migrateNestedSections() {
  console.log('🔄 Updating website_settings to include nested dynamic arrays and isActive flags...');
  const client = await pool.connect();
  try {
    const defaultHeaderLinks = JSON.stringify([
      { id: "h1", label: "Products", url: "/#features", isActive: true },
      { id: "h2", label: "Pricing", url: "/pricing", isActive: true }
    ]);

    const defaultFooterColumns = JSON.stringify([
      {
        id: "fc1",
        title: "Product",
        isActive: true,
        links: [
          { id: "fl1", label: "HR Data", url: "/#features", isActive: true },
          { id: "fl2", label: "Payroll", url: "/#features", isActive: true },
          { id: "fl3", label: "Time Tracking", url: "/#features", isActive: true }
        ]
      },
      {
        id: "fc2",
        title: "Company",
        isActive: true,
        links: [
          { id: "fl4", label: "About Us", url: "/about-us", isActive: true },
          { id: "fl5", label: "Contact", url: "/contact", isActive: true }
        ]
      },
      {
        id: "fc3",
        title: "Legal",
        isActive: true,
        links: [
          { id: "fl6", label: "Privacy Policy", url: "/privacy-policy", isActive: true },
          { id: "fl7", label: "Terms of Service", url: "/terms-of-service", isActive: true }
        ]
      }
    ]);

    const defaultSections = JSON.stringify([
      { 
        id: "1", 
        type: "Hero", 
        isActive: true,
        title: "The complete HR software <br class=\"hidden md:block\"/><span class=\"text-primary-500\">for growing companies.</span>", 
        subtitle: "Set your people free to do great work with the only HR software you'll ever need. Manage employee data, payroll, time off, and performance in one beautiful, automated platform." 
      },
      { 
        id: "2", 
        type: "SocialProof", 
        isActive: true,
        title: "Trusted by over 30,000 companies worldwide",
        items: [
          { id: "sp1", name: "Acme Corp", icon: "M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" },
          { id: "sp2", name: "GlobalTech", icon: "circle" },
          { id: "sp3", name: "Innovate.io", icon: "rect" },
          { id: "sp4", name: "Nexus", icon: "polygon" }
        ]
      },
      { 
        id: "3", 
        type: "DeepDive", 
        isActive: true,
        title: "Everything you need, <br/><span class=\"text-primary-500\">perfectly organized.</span>", 
        subtitle: "Say goodbye to messy spreadsheets and scattered documents. HRMS Pro brings all your critical employee data into one secure, centralized, and beautifully designed interface.",
        items: [
          { id: "dd1", title: "Centralized Directory", desc: "Find any employee in seconds with advanced filtering." },
          { id: "dd2", title: "Secure Document Storage", desc: "Store contracts, IDs, and compliance forms safely." },
          { id: "dd3", title: "Automated Onboarding", desc: "Create workflows that welcome new hires instantly." }
        ]
      },
      { 
        id: "4", 
        type: "TimeTracking", 
        isActive: true,
        title: "Time tracking that <br/><span class=\"text-primary-400\">actually works.</span>", 
        subtitle: "Empower your team with intuitive clock-ins, seamless PTO requests, and dynamic shift rostering. Approvals are just one click away for managers.",
        items: [
          { id: "tt1", title: "Smart Shift Rostering", desc: "Visual drag-and-drop calendars for scheduling." },
          { id: "tt2", title: "Geo-Fenced Clock Ins", desc: "Ensure employees clock in from the right location." }
        ]
      },
      { 
        id: "5", 
        type: "GridFeatures", 
        isActive: true,
        title: "A complete suite of modules", 
        subtitle: "Everything you need to manage the entire employee lifecycle without leaving the platform.",
        items: [
          { id: "gf1", title: 'Core HR Data', desc: 'Secure database for all employee records and documents.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { id: "gf2", title: 'Payroll Processing', desc: 'Automated payroll with dynamic payslips and tax calculations.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: "gf3", title: 'Performance Reviews', desc: 'Set goals, run 360 reviews, and track employee growth.', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { id: "gf4", title: 'Asset Management', desc: 'Assign and track laptops, monitors, and other company property.', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { id: "gf5", title: 'Recruitment (ATS)', desc: 'Publish jobs, track applicants, and schedule interviews.', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { id: "gf6", title: 'Real-time Chat', desc: 'Built-in messaging system for instant team collaboration.', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        ]
      },
      { 
        id: "6", 
        type: "Testimonial", 
        isActive: true,
        text: "Before HRMS Pro, we used 4 different tools for payroll, time off, reviews, and documents. Consolidating everything into one platform saved our HR team 20 hours a week.", 
        author: "Sarah Jenkins", 
        role: "VP of People, GlobalTech" 
      },
      { 
        id: "7", 
        type: "CTA", 
        isActive: true,
        title: "Ready to transform your HR?", 
        subtitle: "Join thousands of companies using HRMS Pro to streamline their HR processes and build better workplaces." 
      }
    ]);

    // Force overwrite all existing JSON fields with the fully-nested defaults
    await client.query(`
      UPDATE shared.website_settings 
      SET 
        sections = '${defaultSections.replace(/'/g, "''")}'::jsonb,
        header_links = '${defaultHeaderLinks.replace(/'/g, "''")}'::jsonb,
        footer_columns = '${defaultFooterColumns.replace(/'/g, "''")}'::jsonb
    `);

    console.log('✅ website_settings table updated with nested arrays and isActive toggles.');

  } catch (error) {
    console.error('❌ Error updating website_settings table:', error);
  } finally {
    client.release();
    process.exit();
  }
}

migrateNestedSections();
