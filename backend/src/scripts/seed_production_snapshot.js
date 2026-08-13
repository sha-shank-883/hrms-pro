const { pool } = require('../config/database');

const EXACT_WEBSITE_SETTINGS = {
  hero_title: "Everything you need to <span class=\"text-primary-600\">scale</span> your workforce",
  hero_subtitle: "HRMS Pro is the all-in-one platform for payroll, attendance, recruitment and performance management. Build a company your employees love.",
  primary_color: "#16a34a",
  font_family: "Inter",
  show_social_proof: true,
  show_deep_dive: true,
  show_time_tracking: true,
  show_grid_features: true,
  show_testimonials: true,
  show_cta: true,
  social_proof_title: "Join 5,000+ modern companies",
  deep_dive_title: "Everything you need, <br/><span class=\"text-primary-500\">perfectly organized.</span>",
  deep_dive_subtitle: "Say goodbye to messy spreadsheets and scattered documents. HRMS Pro brings all your critical employee data into one secure, centralized, and beautifully designed interface.",
  time_tracking_title: "Time tracking that <br/><span class=\"text-primary-400\">actually works.</span>",
  time_tracking_subtitle: "Empower your team with intuitive clock-ins, seamless PTO requests, and dynamic shift rostering. Approvals are just one click away for managers.",
  grid_features_title: "A comprehensive suite for the modern enterprise",
  grid_features_subtitle: "From talent acquisition to offboarding, equip your HR department with state-of-the-art tools designed to maximize productivity and employee satisfaction.",
  testimonial_text: "Switching to HRMS Pro was a game-changer for our organization. We reduced our administrative overhead by 40% and finally have real-time visibility into our global workforce.",
  testimonial_author: "Michael Chang",
  testimonial_role: "Chief Operating Officer, EnterpriseTech",
  cta_title: "Ready to modernize your HR operations?",
  cta_subtitle: "Request a personalized demonstration today and discover how HRMS Pro can transform your business.",
  contact_email: "info@hrmspro.online",
  contact_phone: "+91 8881781203",
  contact_address: "Sector 4, Noida, India, 201301",
  company_name: "HRMS Pro",
  tagline: "Modern HR management platform for growing businesses.",
  copyright_text: "All rights reserved.",
  theme_mode: "light",
  glassmorphism_enabled: true,
  sections: [
    {
      id: "hero-default",
      name: "Main Hero",
      type: "Hero",
      title: "Everything you need to <span class=\"text-primary-600\">scale</span> your workforce",
      isActive: true,
      subtitle: "HRMS Pro is the all-in-one platform for payroll, attendance, recruitment and performance management. Build a company your employees love.",
      customCss: ""
    },
    {
      id: "social-proof",
      name: "Trust Bar",
      type: "SocialProof",
      items: [
        { id: "1", name: "TechCorp" },
        { id: "2", name: "GrowthAI" },
        { id: "3", name: "DataNexus" },
        { id: "4", name: "Nexus" },
        { id: "5", name: "Stellar" }
      ],
      title: "Join 5,000+ modern companies",
      isActive: true
    },
    {
      id: "features-heavy",
      name: "Core Features",
      type: "FeatureHeavy",
      items: [
        {
          id: "f1",
          desc: "Run payroll in 3 clicks with automated tax filings and direct deposits.",
          icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          title: "Automated Payroll"
        },
        {
          id: "f2",
          desc: "Geofenced clock-ins and biometric integration for error-free tracking.",
          icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
          title: "Smart Attendance"
        },
        {
          id: "f3",
          desc: "360-degree feedback and goal tracking to nurture your top talent.",
          icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
          title: "Performance Review"
        }
      ],
      title: "Powerful tools for every HR challenge",
      isActive: true,
      subtitle: "Our platform is designed to handle complexity while remaining simple enough for everyone to use."
    }
  ],
  header_links: [
    { id: "l1", url: "#features", label: "Features" },
    { id: "l2", url: "/solutions", label: "Solutions" },
    { id: "l3", url: "/resources", label: "Resources" },
    { id: "l4", url: "/pricing", label: "Pricing" }
  ],
  footer_columns: [
    {
      id: "f-default-1",
      title: "Product",
      isActive: true,
      links: [
        { id: "fl-1-1", url: "/features", label: "Features", isActive: true },
        { id: "fl-1-2", url: "/pricing", label: "Pricing", isActive: true },
        { id: "fl-1-3", url: "/integrations", label: "Integrations", isActive: true },
        { id: "fl-1-4", url: "/demo", label: "Demo", isActive: true }
      ]
    },
    {
      id: "f-default-2",
      title: "Resources",
      isActive: true,
      links: [
        { id: "fl-2-1", url: "/blog", label: "Blog", isActive: true },
        { id: "fl-2-2", url: "/case-studies", label: "Case Studies", isActive: true },
        { id: "fl-2-3", url: "/faq", label: "FAQ", isActive: true },
        { id: "fl-2-4", url: "#", label: "Help Center", isActive: true }
      ]
    },
    {
      id: "f-default-3",
      title: "Company",
      isActive: true,
      links: [
        { id: "fl-3-1", url: "/about", label: "About", isActive: true },
        { id: "fl-3-2", url: "/careers", label: "Careers", isActive: true },
        { id: "fl-3-3", url: "/contact", label: "Contact", isActive: true },
        { id: "fl-3-4", url: "/privacy", label: "Privacy Policy", isActive: true },
        { id: "fl-3-5", url: "/terms", label: "Terms of Service", isActive: true }
      ]
    }
  ],
  social_links: [
    { url: "https://linkedin.com/company/hrmspro", label: "LinkedIn", platform: "linkedin" },
    { url: "https://twitter.com/hrmspro", label: "Twitter", platform: "twitter" },
    { url: "https://github.com/hrmspro", label: "GitHub", platform: "github" },
    { url: "https://youtube.com/@hrmspro", label: "YouTube", platform: "youtube" }
  ],
  awards: [
    { icon: "star", label: "Capterra Best Value 2026" },
    { icon: "star", label: "G2 Leader HRMS 2026" },
    { icon: "star", label: "Top Rated 4.9/5" },
    { icon: "shield", label: "SOC 2 Type II Certified" }
  ],
  badges: [
    { icon: "shield", label: "SOC 2 Type II" },
    { icon: "check", label: "GDPR Compliant" }
  ],
  sign_in_label: "Sign In",
  cta_label: "Get a Demo"
};

async function seedProductionSnapshot() {
  console.log('🔄 Running Master Production Snapshot Seeder...');
  const client = await pool.connect();
  try {
    // 1. Ensure shared schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS shared`);

    // 2. Ensure Super Admin Users in tenant_default
    await client.query(`CREATE SCHEMA IF NOT EXISTS "tenant_default"`);
    
    await client.query(`
      INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan, employee_limit)
      VALUES ('tenant_default', 'HRMS Pro Master Organization', 'active', 'scale', 500)
      ON CONFLICT (tenant_id) DO UPDATE
        SET status = 'active',
            subscription_plan = 'scale',
            employee_limit = 500;
    `);

    // Ensure users table exists in tenant_default
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "tenant_default".users (
          user_id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'employee',
          permissions JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed info@hrmspro.online & admin@hrmspro.com (Password: Hrmspro@123)
      await client.query(`
        INSERT INTO "tenant_default".users (email, password_hash, role, is_active)
        VALUES 
          ('info@hrmspro.online', '$2b$10$KSjIGnBOJwk/rkxlsg8WnewdeMQWjHerRJYTOWzIac7UY0DDzQ5Le', 'admin', true),
          ('admin@hrmspro.com', '$2b$10$KSjIGnBOJwk/rkxlsg8WnewdeMQWjHerRJYTOWzIac7UY0DDzQ5Le', 'admin', true)
        ON CONFLICT (email) DO UPDATE
          SET password_hash = EXCLUDED.password_hash,
              role = 'admin',
              is_active = true;
      `);
      console.log('✅ Super Admin users guaranteed in tenant_default: info@hrmspro.online (Hrmspro@123)');
    } catch (userErr) {
      console.warn('⚠️ User seed notice:', userErr.message);
    }

    // 3. Ensure and Seed Website Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.website_settings (
        id SERIAL PRIMARY KEY,
        primary_color VARCHAR(50),
        font_family VARCHAR(100),
        logo_url TEXT,
        header_links JSONB DEFAULT '[]',
        footer_columns JSONB DEFAULT '[]',
        sections JSONB DEFAULT '[]',
        custom_css TEXT,
        custom_js TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const wsCheck = await client.query('SELECT id FROM shared.website_settings LIMIT 1');
    if (wsCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO shared.website_settings (
          primary_color, font_family, company_name, tagline, contact_email, contact_phone, contact_address,
          sections, header_links, footer_columns, social_links, awards, badges, sign_in_label, cta_label,
          show_social_proof, show_deep_dive, show_time_tracking, show_grid_features, show_testimonials, show_cta,
          social_proof_title, deep_dive_title, deep_dive_subtitle, time_tracking_title, time_tracking_subtitle,
          grid_features_title, grid_features_subtitle, testimonial_text, testimonial_author, testimonial_role,
          cta_title, cta_subtitle, theme_mode, glassmorphism_enabled
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31,
          $32, $33, $34, $35
        )
      `, [
        EXACT_WEBSITE_SETTINGS.primary_color,
        EXACT_WEBSITE_SETTINGS.font_family,
        EXACT_WEBSITE_SETTINGS.company_name,
        EXACT_WEBSITE_SETTINGS.tagline,
        EXACT_WEBSITE_SETTINGS.contact_email,
        EXACT_WEBSITE_SETTINGS.contact_phone,
        EXACT_WEBSITE_SETTINGS.contact_address,
        JSON.stringify(EXACT_WEBSITE_SETTINGS.sections),
        JSON.stringify(EXACT_WEBSITE_SETTINGS.header_links),
        JSON.stringify(EXACT_WEBSITE_SETTINGS.footer_columns),
        JSON.stringify(EXACT_WEBSITE_SETTINGS.social_links),
        JSON.stringify(EXACT_WEBSITE_SETTINGS.awards),
        JSON.stringify(EXACT_WEBSITE_SETTINGS.badges),
        EXACT_WEBSITE_SETTINGS.sign_in_label,
        EXACT_WEBSITE_SETTINGS.cta_label,
        EXACT_WEBSITE_SETTINGS.show_social_proof,
        EXACT_WEBSITE_SETTINGS.show_deep_dive,
        EXACT_WEBSITE_SETTINGS.show_time_tracking,
        EXACT_WEBSITE_SETTINGS.show_grid_features,
        EXACT_WEBSITE_SETTINGS.show_testimonials,
        EXACT_WEBSITE_SETTINGS.show_cta,
        EXACT_WEBSITE_SETTINGS.social_proof_title,
        EXACT_WEBSITE_SETTINGS.deep_dive_title,
        EXACT_WEBSITE_SETTINGS.deep_dive_subtitle,
        EXACT_WEBSITE_SETTINGS.time_tracking_title,
        EXACT_WEBSITE_SETTINGS.time_tracking_subtitle,
        EXACT_WEBSITE_SETTINGS.grid_features_title,
        EXACT_WEBSITE_SETTINGS.grid_features_subtitle,
        EXACT_WEBSITE_SETTINGS.testimonial_text,
        EXACT_WEBSITE_SETTINGS.testimonial_author,
        EXACT_WEBSITE_SETTINGS.testimonial_role,
        EXACT_WEBSITE_SETTINGS.cta_title,
        EXACT_WEBSITE_SETTINGS.cta_subtitle,
        EXACT_WEBSITE_SETTINGS.theme_mode,
        EXACT_WEBSITE_SETTINGS.glassmorphism_enabled
      ]);
      console.log('✅ Website settings seeded with complete local design and contact info.');
    }

    console.log('🎉 Master Production Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Error during master snapshot seed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedProductionSnapshot();
