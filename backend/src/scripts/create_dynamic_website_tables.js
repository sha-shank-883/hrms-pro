const { pool } = require('../config/database');

// ─────────────────────────────────────────────────────────────
// PHASE 1 — Dynamic Website: Themes + Labels schema & seed data
// Creates shared.website_themes and shared.website_labels,
// extends shared.website_global_settings with theme columns,
// seeds 6 preset design themes and the content dictionary.
// Idempotent: safe to re-run.
// ─────────────────────────────────────────────────────────────

const THEMES = [
  {
    slug: 'indigo-pro',
    name: 'Indigo Pro',
    parameters: {
      colors: {
        primary: '#6366f1', primary_hover: '#4f46e5', secondary: '#8b5cf6', accent: '#a855f7',
        success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6',
        page_bg: '#f9fafb', card_bg: '#ffffff', text_primary: '#111827', text_secondary: '#6b7280',
        text_muted: '#9ca3af', border: '#e5e7eb', sidebar_bg: '#ffffff', header_bg: '#ffffff',
        primary_gradient: 'linear-gradient(to right, #6366f1, #8b5cf6)'
      },
      typography: {
        font_family: 'Inter, system-ui, -apple-system, sans-serif',
        font_display: 'Inter, system-ui, -apple-system, sans-serif',
        font_size_base: '16px', heading_weight: '700', body_line_height: '1.6', letter_spacing: '0'
      },
      radii: { radius_sm: '8px', radius_md: '12px', radius_lg: '16px' },
      shadows: {
        shadow_card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        shadow_hover: '0 10px 30px rgba(0,0,0,0.08)',
        shadow_modal: '0 20px 40px rgba(0,0,0,0.15)'
      },
      spacing: { spacing_unit: '8px', section_padding_y: '96px', card_padding: '24px', grid_gap: '24px' },
      mode: { theme_mode: 'light', glassmorphism_enabled: true, layout_width: 'boxed' },
      branding: { logo_url: '', favicon_url: '' }
    }
  },
  {
    slug: 'emerald-growth',
    name: 'Emerald Growth',
    parameters: {
      colors: {
        primary: '#10b981', primary_hover: '#059669', secondary: '#14b8a6', accent: '#06b6d4',
        success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6',
        page_bg: '#f7faf8', card_bg: '#ffffff', text_primary: '#0f172a', text_secondary: '#64748b',
        text_muted: '#94a3b8', border: '#e2e8f0', sidebar_bg: '#0f172a', header_bg: '#ffffff',
        primary_gradient: 'linear-gradient(to right, #10b981, #06b6d4)'
      },
      typography: {
        font_family: 'Inter, system-ui, -apple-system, sans-serif',
        font_display: 'Inter, system-ui, -apple-system, sans-serif',
        font_size_base: '16px', heading_weight: '800', body_line_height: '1.6', letter_spacing: '0'
      },
      radii: { radius_sm: '8px', radius_md: '14px', radius_lg: '20px' },
      shadows: {
        shadow_card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        shadow_hover: '0 12px 32px rgba(16,185,129,0.15)',
        shadow_modal: '0 20px 40px rgba(0,0,0,0.15)'
      },
      spacing: { spacing_unit: '8px', section_padding_y: '104px', card_padding: '28px', grid_gap: '24px' },
      mode: { theme_mode: 'light', glassmorphism_enabled: false, layout_width: 'boxed' },
      branding: { logo_url: '', favicon_url: '' }
    }
  },
  {
    slug: 'ocean-trust',
    name: 'Ocean Trust',
    parameters: {
      colors: {
        primary: '#2563eb', primary_hover: '#1d4ed8', secondary: '#0ea5e9', accent: '#06b6d4',
        success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6',
        page_bg: '#f8fafc', card_bg: '#ffffff', text_primary: '#1e293b', text_secondary: '#64748b',
        text_muted: '#94a3b8', border: '#e2e8f0', sidebar_bg: '#0f172a', header_bg: '#ffffff',
        primary_gradient: 'linear-gradient(to right, #2563eb, #0ea5e9)'
      },
      typography: {
        font_family: 'Inter, system-ui, -apple-system, sans-serif',
        font_display: 'Inter, system-ui, -apple-system, sans-serif',
        font_size_base: '15px', heading_weight: '700', body_line_height: '1.55', letter_spacing: '0'
      },
      radii: { radius_sm: '6px', radius_md: '10px', radius_lg: '12px' },
      shadows: {
        shadow_card: '0 1px 2px rgba(0,0,0,0.05)',
        shadow_hover: '0 8px 24px rgba(37,99,235,0.12)',
        shadow_modal: '0 16px 40px rgba(0,0,0,0.15)'
      },
      spacing: { spacing_unit: '8px', section_padding_y: '88px', card_padding: '24px', grid_gap: '20px' },
      mode: { theme_mode: 'light', glassmorphism_enabled: false, layout_width: 'boxed' },
      branding: { logo_url: '', favicon_url: '' }
    }
  },
  {
    slug: 'midnight-luxe',
    name: 'Midnight Luxe',
    parameters: {
      colors: {
        primary: '#d4af37', primary_hover: '#f0c94a', secondary: '#1e293b', accent: '#e2b93b',
        success: '#34d399', warning: '#fbbf24', danger: '#f87171', info: '#60a5fa',
        page_bg: '#0b0f1a', card_bg: '#111827', text_primary: '#f9fafb', text_secondary: '#9ca3af',
        text_muted: '#6b7280', border: '#1f2937', sidebar_bg: '#0b0f1a', header_bg: '#111827',
        primary_gradient: 'linear-gradient(to right, #d4af37, #f0c94a)'
      },
      typography: {
        font_family: 'Inter, system-ui, -apple-system, sans-serif',
        font_display: "'Playfair Display', 'Georgia', serif",
        font_size_base: '16px', heading_weight: '600', body_line_height: '1.7', letter_spacing: '0.01em'
      },
      radii: { radius_sm: '10px', radius_md: '16px', radius_lg: '24px' },
      shadows: {
        shadow_card: '0 1px 3px rgba(0,0,0,0.4)',
        shadow_hover: '0 16px 40px rgba(0,0,0,0.5)',
        shadow_modal: '0 24px 60px rgba(0,0,0,0.6)'
      },
      spacing: { spacing_unit: '8px', section_padding_y: '112px', card_padding: '28px', grid_gap: '24px' },
      mode: { theme_mode: 'dark', glassmorphism_enabled: true, layout_width: 'boxed' },
      branding: { logo_url: '', favicon_url: '' }
    }
  },
  {
    slug: 'minimal-stone',
    name: 'Minimal Stone',
    parameters: {
      colors: {
        primary: '#111827', primary_hover: '#374151', secondary: '#4b5563', accent: '#6b7280',
        success: '#16a34a', warning: '#d97706', danger: '#dc2626', info: '#2563eb',
        page_bg: '#fafafa', card_bg: '#ffffff', text_primary: '#111827', text_secondary: '#525252',
        text_muted: '#a3a3a3', border: '#e5e5e5', sidebar_bg: '#fafafa', header_bg: '#ffffff',
        primary_gradient: 'linear-gradient(to right, #111827, #4b5563)'
      },
      typography: {
        font_family: "'Inter', system-ui, sans-serif",
        font_display: "'Inter', system-ui, sans-serif",
        font_size_base: '16px', heading_weight: '600', body_line_height: '1.5', letter_spacing: '-0.01em'
      },
      radii: { radius_sm: '2px', radius_md: '4px', radius_lg: '6px' },
      shadows: {
        shadow_card: '0 1px 1px rgba(0,0,0,0.03)',
        shadow_hover: '0 4px 12px rgba(0,0,0,0.06)',
        shadow_modal: '0 12px 32px rgba(0,0,0,0.12)'
      },
      spacing: { spacing_unit: '8px', section_padding_y: '80px', card_padding: '20px', grid_gap: '16px' },
      mode: { theme_mode: 'light', glassmorphism_enabled: false, layout_width: 'full' },
      branding: { logo_url: '', favicon_url: '' }
    }
  },
  {
    slug: 'sunset-energy',
    name: 'Sunset Energy',
    parameters: {
      colors: {
        primary: '#f97316', primary_hover: '#ea580c', secondary: '#ec4899', accent: '#f43f5e',
        success: '#22c55e', warning: '#eab308', danger: '#ef4444', info: '#3b82f6',
        page_bg: '#fff7f5', card_bg: '#ffffff', text_primary: '#1c1917', text_secondary: '#78716c',
        text_muted: '#a8a29e', border: '#f5e5e0', sidebar_bg: '#ffffff', header_bg: '#ffffff',
        primary_gradient: 'linear-gradient(to right, #f97316, #ec4899)'
      },
      typography: {
        font_family: 'Inter, system-ui, -apple-system, sans-serif',
        font_display: 'Inter, system-ui, -apple-system, sans-serif',
        font_size_base: '16px', heading_weight: '800', body_line_height: '1.6', letter_spacing: '0'
      },
      radii: { radius_sm: '10px', radius_md: '16px', radius_lg: '24px' },
      shadows: {
        shadow_card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        shadow_hover: '0 14px 36px rgba(249,115,22,0.18)',
        shadow_modal: '0 20px 48px rgba(0,0,0,0.16)'
      },
      spacing: { spacing_unit: '8px', section_padding_y: '96px', card_padding: '24px', grid_gap: '24px' },
      mode: { theme_mode: 'light', glassmorphism_enabled: true, layout_width: 'boxed' },
      branding: { logo_url: '', favicon_url: '' }
    }
  }
];

// namespace, key, value, description
const LABELS = [
  // ── common ──
  ['common', 'site_name', 'HRMS Pro', 'Brand / site name'],
  ['common', 'tagline', 'Modern HR management platform for growing businesses.', 'Site tagline'],
  ['common', 'get_demo', 'Get a Demo', 'Primary CTA label'],
  ['common', 'sign_in', 'Sign In', 'Login link label'],
  ['common', 'get_started', 'Get Started', 'Generic CTA label'],
  ['common', 'learn_more', 'Learn More', 'Generic link label'],
  ['common', 'subscribe', 'Subscribe', 'Newsletter button label'],
  ['common', 'submit', 'Submit', 'Generic form submit label'],
  ['common', 'loading', 'Loading...', 'Loading indicator'],
  ['common', '404_title', 'Page Not Found', '404 heading'],
  ['common', '404_message', 'The page you are looking for does not exist.', '404 body text'],
  ['common', 'back_home', 'Back to Home', '404 return link'],
  ['common', 'copyright', 'All rights reserved.', 'Footer copyright suffix'],
  ['common', 'watch_overview', 'Watch Overview', 'Hero secondary CTA'],
  ['common', 'newsletter_headline', 'Stay ahead with HR insights. Get the latest guides and trends delivered weekly.', 'Newsletter bar text'],
  ['common', 'newsletter_placeholder', 'Enter your work email', 'Newsletter input placeholder'],
  ['common', 'theme_toggle', 'Toggle theme', 'Theme toggle title'],
  ['common', 'platform', 'Platform', 'Nav mega-menu label'],

  // ── nav ──
  ['nav', 'platform', 'Platform', 'Primary nav item'],
  ['nav', 'core_hr', 'Core HR', 'Nav child'],
  ['nav', 'time_attendance', 'Time & Attendance', 'Nav child'],
  ['nav', 'payroll', 'Payroll', 'Nav child'],
  ['nav', 'performance', 'Performance & Goals', 'Nav child'],
  ['nav', 'talent', 'Talent Management', 'Nav child'],
  ['nav', 'analytics', 'Analytics & Reporting', 'Nav child'],
  ['nav', 'pricing', 'Pricing', 'Nav item'],
  ['nav', 'about', 'About', 'Nav item'],
  ['nav', 'contact', 'Contact', 'Nav item'],
  ['nav', 'resources', 'Resources', 'Nav mega-menu label'],
  ['nav', 'blog', 'Blog', 'Resources child'],
  ['nav', 'faq', 'FAQ', 'Resources child'],
  ['nav', 'compare', 'Compare', 'Resources group title'],
  ['nav', 'company', 'Company', 'Resources group title'],
  ['nav', 'vs_bamboohr', 'vs BambooHR', 'Compare link'],
  ['nav', 'vs_gusto', 'vs Gusto', 'Compare link'],
  ['nav', 'vs_rippling', 'vs Rippling', 'Compare link'],
  ['nav', 'careers', 'Careers', 'Company link'],
  ['nav', 'partners', 'Partners', 'Company link'],

  // ── hero ──
  ['hero', 'badge', 'Now Available — AI-Native HCM Platform v3.0', 'Hero badge text'],
  ['hero', 'title_highlight', 'AI-Powered', 'Hero highlighted word'],
  ['hero', 'title', 'HR Platform for Global Enterprises', 'Hero headline'],
  ['hero', 'subtitle', 'Unify your people, payroll, and performance data on a single platform. Automate workflows, unlock AI-driven insights, and empower your workforce — from hire to retire.', 'Hero subheadline'],
  ['hero', 'stat_1_value', '10K+', 'Hero stat 1 value'],
  ['hero', 'stat_1_label', 'Companies Trust Us', 'Hero stat 1 label'],
  ['hero', 'stat_2_value', '2M+', 'Hero stat 2 value'],
  ['hero', 'stat_2_label', 'Employees Onboarded', 'Hero stat 2 label'],
  ['hero', 'stat_3_value', '150+', 'Hero stat 3 value'],
  ['hero', 'stat_3_label', 'Countries Supported', 'Hero stat 3 label'],
  ['hero', 'stat_4_value', '99.9%', 'Hero stat 4 value'],
  ['hero', 'stat_4_label', 'Uptime SLA', 'Hero stat 4 label'],

  // ── social proof ──
  ['social', 'title', 'Trusted by innovative teams worldwide', 'Logos marquee heading'],
  ['social', 'security_title', 'Security & Compliance', 'Trust bar heading'],

  // ── features ──
  ['features', 'eyebrow', 'All-in-One Platform', 'Section eyebrow'],
  ['features', 'title', 'Everything you need to manage your people', 'Features heading'],
  ['features', 'subtitle', 'From recruiting to retirement, HRMS Pro unifies every stage of the employee lifecycle on a single, intelligent platform.', 'Features subtext'],
  ['features', 'grid_eyebrow', 'Features', 'Feature grid eyebrow'],
  ['features', 'grid_title', 'Enterprise-grade HR capabilities', 'Feature grid heading'],
  ['features', 'grid_subtitle', 'Deep functionality across every HR domain, backed by AI and global compliance.', 'Feature grid subtext'],
  ['features', 'ai_eyebrow', 'HRMS Pro AI', 'AI section eyebrow'],
  ['features', 'ai_title', 'Intelligence that transforms how you work', 'AI section heading'],
  ['features', 'ai_subtitle', 'Our AI engine learns your workforce patterns, predicts outcomes, and automates complex processes — so your HR team can focus on what matters most: your people.', 'AI section subtext'],

  // ── pricing ──
  ['pricing', 'title', 'Simple, transparent pricing', 'Pricing heading'],
  ['pricing', 'subtitle', 'Choose the plan that grows with your team.', 'Pricing subtext'],
  ['pricing', 'per_employee', 'per employee/month', 'Pricing period label'],
  ['pricing', 'popular', 'Most Popular', 'Featured plan badge'],
  ['pricing', 'choose_plan', 'Choose Plan', 'Plan CTA label'],
  ['pricing', 'talk_sales', 'Talk to Sales', 'Enterprise CTA label'],

  // ── testimonials ──
  ['testimonials', 'title', 'Trusted by HR leaders worldwide', 'Testimonials heading'],

  // ── blog ──
  ['blog', 'eyebrow', 'Blog', 'Blog section eyebrow'],
  ['blog', 'title', 'Latest insights from our team', 'Blog section heading'],
  ['blog', 'subtitle', 'Actionable HR advice, industry trends, and practical guides to help you manage your workforce better.', 'Blog section subtext'],
  ['blog', 'read_more', 'Read more', 'Blog link label'],

  // ── cta ──
  ['cta', 'title', 'Ready to transform your HR?', 'CTA section heading'],
  ['cta', 'subtitle', 'Join thousands of companies using HRMS Pro to streamline their HR processes and build better workplaces.', 'CTA section subtext'],
  ['cta', 'button', 'Get a Demo', 'CTA button label'],
  ['cta', 'secondary', 'Compare Pricing', 'CTA secondary label'],

  // ── footer ──
  ['footer', 'company_desc', 'Enterprise-grade HR management platform for global teams. Automate payroll, track attendance, manage performance, and empower your workforce with AI-driven insights across 150+ countries.', 'Footer brand description'],
  ['footer', 'newsletter_title', 'Stay ahead with HR insights. Get the latest guides and trends delivered weekly.', 'Footer newsletter text'],
  ['footer', 'privacy', 'Privacy Policy', 'Footer legal link'],
  ['footer', 'terms', 'Terms of Service', 'Footer legal link'],
  ['footer', 'gdpr', 'GDPR', 'Footer legal link'],
  ['footer', 'soc2', 'SOC 2', 'Footer legal link'],
  ['footer', 'data_processing', 'Data Processing', 'Footer legal link'],
  ['footer', 'help_center', 'Help Center', 'Footer support link'],
  ['footer', 'community', 'Community', 'Footer support link'],
  ['footer', 'contact_support', 'Contact Support', 'Footer support link'],
  ['footer', 'system_status', 'System Status', 'Footer support link'],
  ['footer', 'documentation', 'Documentation', 'Footer resource link'],
  ['footer', 'status_page', 'Status Page', 'Footer resource link'],

  // ── auth ──
  ['auth', 'login_title', 'Welcome back', 'Login heading'],
  ['auth', 'login_subtitle', 'Sign in to your HRMS Pro account.', 'Login subtext'],
  ['auth', 'email', 'Email address', 'Field label'],
  ['auth', 'password', 'Password', 'Field label'],
  ['auth', 'forgot_password', 'Forgot password?', 'Link label'],
  ['auth', 'no_account', 'No account yet?', 'Login signup prompt'],
  ['auth', 'create_account', 'Create one', 'Login signup link'],

  // ── demo ──
  ['demo', 'headline', 'Try HRMS Pro free for 14 days', 'Demo page headline'],
  ['demo', 'subheadline', 'Get instant access to a fully-functional HRMS environment. No credit card required, no commitment.', 'Demo page subheadline'],
  ['demo', 'button', 'Start Free Trial', 'Demo CTA label'],
  ['demo', 'badge', 'Get Started', 'Demo badge label'],
  ['demo', 'success_title', 'Demo Request Received!', 'Demo success heading'],
  ['demo', 'success_message', 'Thank you for your interest! We are setting up your personalized demo environment. You will receive an email with your login credentials within the next 15 minutes.', 'Demo success message'],

  // ── contact ──
  ['contact', 'title', 'Get in touch', 'Contact heading'],
  ['contact', 'subtitle', 'We would love to hear from you.', 'Contact subtext'],
  ['contact', 'name', 'Your name', 'Field label'],
  ['contact', 'email', 'Your email', 'Field label'],
  ['contact', 'message', 'Your message', 'Field label'],
  ['contact', 'send', 'Send Message', 'Submit label'],

  // ── compare ──
  ['compare', 'hero_title', 'HRMS Pro vs {competitor}', 'Comparison hero (placeholder replaced at render)'],
  ['compare', 'best_value', 'Best Value', 'Comparison badge'],
  ['compare', 'try_free', 'Try HRMS Pro Free', 'Comparison CTA'],
  ['compare', 'verdict', 'Our Verdict', 'Comparison verdict heading'],

  // ── faq ──
  ['faq', 'eyebrow', 'Support', 'FAQ section eyebrow'],
  ['faq', 'title', 'Frequently Asked Questions', 'FAQ section heading'],
  ['faq', 'subtitle', "Everything you need to know about HRMS Pro. Can't find what you're looking for? Contact our team.", 'FAQ section subtext'],

  // ── privacy ──
  ['privacy', 'title', 'Privacy Policy', 'Privacy page title'],
  ['privacy', 'subtitle', 'We are committed to protecting your personal data and maintaining transparent information practices.', 'Privacy page subtitle'],

  // ── terms ──
  ['terms', 'title', 'Terms of Service', 'Terms page title'],
  ['terms', 'subtitle', 'Please review the terms and conditions governing your use of our services.', 'Terms page subtitle'],

  // ── resources ──
  ['resources', 'eyebrow', 'Knowledge Center', 'Resources section eyebrow'],
  ['resources', 'title', 'Insights to Master your Workforce', 'Resources section title'],
  ['resources', 'subtitle', 'Expert guides, research, and downloadable templates to help you build a productive workforce.', 'Resources section subtext']
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔄 Phase 1: Dynamic Website — themes & labels schema...');
    await client.query('BEGIN');

    // ── 1. website_themes ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.website_themes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT false,
        parameters JSONB NOT NULL DEFAULT '{}',
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ shared.website_themes');

    // ── 2. website_labels ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.website_labels (
        id SERIAL PRIMARY KEY,
        namespace VARCHAR(100) NOT NULL,
        label_key VARCHAR(255) NOT NULL,
        label_value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(namespace, label_key)
      );
      CREATE INDEX IF NOT EXISTS idx_labels_namespace ON shared.website_labels(namespace);
    `);
    console.log('✓ shared.website_labels');

    // ── 3. Extend global settings ──
    await client.query(`
      ALTER TABLE shared.website_global_settings
        ADD COLUMN IF NOT EXISTS active_theme_id INTEGER REFERENCES shared.website_themes(id),
        ADD COLUMN IF NOT EXISTS theme_mode_auto BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS content_dictionary_enabled BOOLEAN DEFAULT true
    `);
    console.log('✓ website_global_settings extended');

    // ── 4. Seed themes ──
    let firstThemeId = null;
    for (const theme of THEMES) {
      const existing = await client.query(
        `SELECT id FROM shared.website_themes WHERE slug = $1`, [theme.slug]
      );
      if (existing.rows.length === 0) {
        const res = await client.query(
          `INSERT INTO shared.website_themes (name, slug, is_active, parameters, is_system)
           VALUES ($1, $2, $3, $4, true) RETURNING id`,
          [theme.name, theme.slug, false, JSON.stringify(theme.parameters)]
        );
        if (!firstThemeId) firstThemeId = res.rows[0].id;
        console.log(`  ✓ theme: ${theme.name}`);
      } else {
        if (!firstThemeId) firstThemeId = existing.rows[0].id;
        console.log(`  = theme exists: ${theme.name}`);
      }
    }

    // ── 5. Activate exactly one theme (first, or current active) ──
    const active = await client.query(
      `SELECT id FROM shared.website_themes WHERE is_active = true ORDER BY id LIMIT 1`
    );
    let activeId;
    if (active.rows.length === 0) {
      const anyTheme = await client.query(
        `SELECT id FROM shared.website_themes ORDER BY id LIMIT 1`
      );
      activeId = anyTheme.rows[0].id;
      await client.query(
        `UPDATE shared.website_themes SET is_active = (id = $1)`, [activeId]
      );
      console.log(`  ✓ activated theme id=${activeId}`);
    } else {
      activeId = active.rows[0].id;
      console.log(`  = theme already active id=${activeId}`);
    }

    // ── 6. Seed labels ──
    let seeded = 0;
    for (const [namespace, key, value, description] of LABELS) {
      await client.query(
        `INSERT INTO shared.website_labels (namespace, label_key, label_value, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (namespace, label_key) DO UPDATE SET description = EXCLUDED.description`,
        [namespace, key, value, description]
      );
      seeded++;
    }
    console.log(`  ✓ labels seeded: ${seeded}`);

    // ── 7. website_pages & website_sections tables ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.website_pages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        page_type VARCHAR(50) DEFAULT 'custom',
        is_published BOOLEAN DEFAULT true,
        is_homepage BOOLEAN DEFAULT false,
        layout_template VARCHAR(100) DEFAULT 'default',
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords VARCHAR(255),
        custom_css TEXT,
        custom_js TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ shared.website_pages');

    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.website_sections (
        id SERIAL PRIMARY KEY,
        page_id INTEGER REFERENCES shared.website_pages(id) ON DELETE CASCADE,
        section_type VARCHAR(100) NOT NULL,
        title VARCHAR(255),
        subtitle TEXT,
        settings JSONB DEFAULT '{}',
        sort_order INTEGER DEFAULT 0,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE shared.website_sections
        ADD COLUMN IF NOT EXISTS title VARCHAR(255),
        ADD COLUMN IF NOT EXISTS subtitle TEXT;
    `);
    console.log('✓ shared.website_sections');

    // Seed Default Core Pages
    const DEFAULT_PAGES = [
      { slug: 'home', title: 'Homepage', is_homepage: true, is_published: true, meta_title: 'HRMS Pro — AI-Powered HR Platform for Global Enterprises' },
      { slug: 'features', title: 'Platform Features', is_homepage: false, is_published: true, meta_title: 'HRMS Pro Features — Workforce Management' },
      { slug: 'pricing', title: 'Pricing & Plans', is_homepage: false, is_published: true, meta_title: 'HRMS Pro Pricing — Simple Transparent Pricing' },
      { slug: 'about', title: 'About Us', is_homepage: false, is_published: true, meta_title: 'About HRMS Pro — Company & Mission' },
      { slug: 'contact', title: 'Contact Us', is_homepage: false, is_published: true, meta_title: 'Contact HRMS Pro Sales & Support' },
      { slug: 'faq', title: 'FAQ & Help', is_homepage: false, is_published: true, meta_title: 'HRMS Pro Frequently Asked Questions' }
    ];

    for (const page of DEFAULT_PAGES) {
      const pageRes = await client.query(
        `INSERT INTO shared.website_pages (slug, title, is_homepage, is_published, meta_title)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
         RETURNING id`,
        [page.slug, page.title, page.is_homepage, page.is_published, page.meta_title]
      );
      const pageId = pageRes.rows[0].id;

      // Check if sections already exist for this page
      const secCheck = await client.query(`SELECT COUNT(*) FROM shared.website_sections WHERE page_id = $1`, [pageId]);
      if (parseInt(secCheck.rows[0].count, 10) === 0) {
        if (page.slug === 'home') {
          await client.query(`
            INSERT INTO shared.website_sections (page_id, section_type, title, subtitle, settings, sort_order) VALUES
            ($1, 'hero', 'HR Platform for Global Enterprises', 'Unify your people, payroll, and performance data on a single platform.', '{"badge":"Now Available — AI-Native HCM Platform v3.0","cta_primary_text":"Get a Demo","cta_primary_url":"/demo","cta_secondary_text":"Watch Overview","cta_secondary_url":"#features"}', 1),
            ($1, 'features', 'Enterprise-grade HR capabilities', 'Deep functionality across every HR domain, backed by AI and global compliance.', '{"items":[{"title":"Core HR","desc":"Employee records & org charts"},{"title":"Payroll","desc":"Global tax & automated runs"},{"title":"Performance","desc":"Goals & review cycles"}]}', 2),
            ($1, 'stats', 'Global Platform Reach', 'Powering thousands of enterprises worldwide.', '{"items":[{"value":"10K+","title":"Companies"},{"value":"2M+","title":"Employees"},{"value":"150+","title":"Countries"},{"value":"99.9%","title":"Uptime SLA"}]}', 3),
            ($1, 'testimonials', 'Trusted by HR Leaders', 'See what our customers say about HRMS Pro.', '{"items":[{"title":"Alex Rivera","desc":"Reduced payroll processing time by 80%.","role":"CHRO"}]}', 4),
            ($1, 'cta', 'Ready to transform your HR?', 'Join thousands of companies building better workplaces.', '{"cta_primary_text":"Get a Demo","cta_primary_url":"/demo"}', 5)
          `, [pageId]);
        } else if (page.slug === 'features') {
          await client.query(`
            INSERT INTO shared.website_sections (page_id, section_type, title, subtitle, settings, sort_order) VALUES
            ($1, 'hero', 'Everything you need to manage your workforce', 'A unified HCM platform covering the entire employee lifecycle.', '{"cta_primary_text":"Get Free Demo","cta_primary_url":"/demo"}', 1),
            ($1, 'features', 'All-in-One HR Domain Functionality', 'Automate payroll, recruitment, attendance, and performance.', '{"items":[{"title":"AI Assistant","desc":"Smart automation"},{"title":"Global Compliance","desc":"150+ countries"}]}', 2)
          `, [pageId]);
        } else if (page.slug === 'pricing') {
          await client.query(`
            INSERT INTO shared.website_sections (page_id, section_type, title, subtitle, settings, sort_order) VALUES
            ($1, 'hero', 'Simple, transparent pricing', 'Start free, upgrade as you grow. No hidden fees.', '{}', 1),
            ($1, 'pricing', 'Plans that fit your growth', 'Select your plan below.', '{"items":[{"name":"Hatch","price":"$6"},{"name":"Scale","price":"$12"},{"name":"Enterprise","price":"Custom"}]}', 2)
          `, [pageId]);
        }
      }
    }

    // Ensure 'home' is strictly the single homepage
    await client.query(`UPDATE shared.website_pages SET is_homepage = (slug = 'home')`);
    console.log('  ✓ homepage set to slug=home');

    // ── 8. Link global settings row 1 to active theme ──
    await client.query(
      `INSERT INTO shared.website_global_settings (id, active_theme_id)
       VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET active_theme_id = EXCLUDED.active_theme_id`,
      [activeId]
    );
    console.log(`  ✓ website_global_settings.active_theme_id = ${activeId}`);

    await client.query('COMMIT');
    console.log('✅ Phase 1 migration complete.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Phase 1 migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
