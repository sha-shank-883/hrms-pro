const { pool } = require('./database');
const bcrypt = require('bcryptjs');

/**
 * Idempotent Auto-Migration on Server Startup
 * Ensures all shared tables, columns, plan tiers, and Super Admin accounts exist.
 */
async function autoMigrate() {
  const client = await pool.connect();
  try {
    // 1. Ensure shared schema
    await client.query('CREATE SCHEMA IF NOT EXISTS shared;');

    // 2. Ensure shared.tenants
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.tenants (
        tenant_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'hatch',
        subscription_expiry TIMESTAMP,
        custom_modules JSONB DEFAULT NULL,
        employee_limit INTEGER DEFAULT 15,
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        billing_address TEXT,
        city VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        tax_id VARCHAR(100),
        billing_currency VARCHAR(10) DEFAULT 'INR',
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS custom_modules JSONB DEFAULT NULL;
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS employee_limit INTEGER DEFAULT 15;
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS billing_address TEXT;
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(10) DEFAULT 'INR';
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
    `);

    // 3. Ensure shared.payment_logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.payment_logs (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
        plan_id VARCHAR(50) NOT NULL,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        gateway VARCHAR(50) NOT NULL DEFAULT 'manual',
        transaction_id VARCHAR(255),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        paypal_order_id VARCHAR(255),
        invoice_number VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        notes TEXT,
        billing_period_start TIMESTAMP,
        billing_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS billing_period_start TIMESTAMP;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMP;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT NULL;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_reason TEXT DEFAULT NULL;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255) DEFAULT NULL;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT NULL;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP DEFAULT NULL;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS seats_purchased INTEGER DEFAULT 1;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT false;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT NULL;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
    `);

    // 4. Ensure shared.coupons and shared.coupon_usages
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
        discount_value NUMERIC(10,2) NOT NULL,
        applicable_plans JSONB DEFAULT '["all"]'::jsonb,
        applicable_cycles JSONB DEFAULT '["all"]'::jsonb,
        min_seats INTEGER DEFAULT 1,
        max_uses INTEGER DEFAULT NULL,
        used_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_by VARCHAR(255) DEFAULT 'superadmin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shared.coupon_usages (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER REFERENCES shared.coupons(id) ON DELETE CASCADE,
        tenant_id VARCHAR(50) NOT NULL REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
        payment_log_id INTEGER,
        discount_amount NUMERIC(10,2) DEFAULT 0,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Ensure shared.plan_configs
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.plan_configs (
        plan_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price_inr NUMERIC(10,2) DEFAULT 0,
        price_usd NUMERIC(10,2) DEFAULT 0,
        employee_limit INTEGER DEFAULT 15,
        modules JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default plans if table is empty
    const planCheck = await client.query('SELECT COUNT(*) FROM shared.plan_configs');
    if (parseInt(planCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO shared.plan_configs (plan_id, name, description, price_inr, price_usd, employee_limit, modules)
        VALUES 
          ('hatch', 'Starter', 'Core HR for small teams and startups', 499, 5, 15, '["employees","attendance","leaves","departments","documents","assets","shifts"]'::jsonb),
          ('scale', 'Professional', 'Complete HR suite with payroll and analytics', 799, 10, 50, '["employees","attendance","leaves","payroll","performance","recruitment","chat","reports","documents","assets","departments","shifts","email_templates"]'::jsonb),
          ('enterprise', 'Enterprise', 'Unlimited scale with custom branding and hardware', 1499, 20, 9999, '["employees","attendance","leaves","payroll","performance","recruitment","chat","reports","documents","assets","departments","shifts","email_templates","audit_logs","biometrics","api_access","custom_domain"]'::jsonb)
        ON CONFLICT (plan_id) DO NOTHING;
      `);
      console.log('✅ Seeded default plan configurations.');
    }

    // 5. Ensure shared.super_admins
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.super_admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) DEFAULT 'Super Admin',
        two_factor_secret VARCHAR(255),
        is_2fa_enabled BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE shared.super_admins ADD COLUMN IF NOT EXISTS last_notifications_read_at TIMESTAMP;
      ALTER TABLE shared.super_admins ADD COLUMN IF NOT EXISTS read_notification_ids JSONB DEFAULT '[]'::jsonb;
    `);

    // Ensure default super admin exists
    const adminCheck = await client.query('SELECT id FROM shared.super_admins WHERE email = $1', ['info@hrmspro.online']);
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('Hrmspro@123', 10);
      await client.query(`
        INSERT INTO shared.super_admins (email, password_hash, full_name, is_active)
        VALUES ($1, $2, 'Super Admin', true)
        ON CONFLICT (email) DO NOTHING;
      `, ['info@hrmspro.online', hash]);
      console.log('✅ Default Super Admin account verified (info@hrmspro.online).');
    }

    // 6. Ensure shared.demo_requests
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.demo_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        tenant_id VARCHAR(100),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
    `);

    // 7. Ensure shared.lead_magnet_downloads & contact_inquiries
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.lead_magnet_downloads (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        resource VARCHAR(255) NOT NULL DEFAULT 'HR Compliance Checklist 2026',
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shared.contact_inquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Ensure shared CMS & Global Website Settings
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

      CREATE TABLE IF NOT EXISTS shared.cms_pages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        content_html TEXT,
        sections JSONB DEFAULT '[]',
        meta_title VARCHAR(255),
        meta_description TEXT,
        published_status VARCHAR(50) DEFAULT 'published',
        layout_template VARCHAR(50) DEFAULT 'default',
        custom_css TEXT,
        custom_js TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shared.biometric_devices (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(100) REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
        serial_number VARCHAR(255) UNIQUE NOT NULL,
        brand VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        last_ping TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shared.app_configs (
        id SERIAL PRIMARY KEY,
        config_key TEXT UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        category TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Ensure Support Module Tables across all tenant schemas
    try {
      const schemaRes = await client.query('SELECT schema_name FROM information_schema.schemata');
      const existingSchemas = new Set(schemaRes.rows.map(r => r.schema_name));

      const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
      const tenantList = ['public', 'tenant_default', ...tenantsRes.rows.map(r => r.tenant_id)];
      const uniqueTenants = Array.from(new Set(tenantList));

      for (const tId of uniqueTenants) {
        if (!existingSchemas.has(tId)) continue;
        try {
          await client.query(`
          CREATE TABLE IF NOT EXISTS "${tId}".faq_categories (
            category_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${tId}".faq_articles (
            article_id SERIAL PRIMARY KEY,
            category_id INTEGER REFERENCES "${tId}".faq_categories(category_id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            keywords JSONB DEFAULT '[]'::jsonb,
            helpful_count INTEGER DEFAULT 0,
            not_helpful_count INTEGER DEFAULT 0,
            is_published BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${tId}".support_agents (
            agent_id SERIAL PRIMARY KEY,
            user_id INTEGER,
            is_available BOOLEAN DEFAULT true,
            max_concurrent_chats INTEGER DEFAULT 5,
            current_chats INTEGER DEFAULT 0,
            auto_assign BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${tId}".support_chats (
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

          CREATE TABLE IF NOT EXISTS "${tId}".support_messages (
            message_id SERIAL PRIMARY KEY,
            chat_id INTEGER REFERENCES "${tId}".support_chats(chat_id) ON DELETE CASCADE,
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

          CREATE TABLE IF NOT EXISTS "${tId}".support_tickets (
            ticket_id SERIAL PRIMARY KEY,
            ticket_number VARCHAR(50) UNIQUE NOT NULL,
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

          CREATE TABLE IF NOT EXISTS "${tId}".ticket_comments (
            comment_id SERIAL PRIMARY KEY,
            ticket_id INTEGER REFERENCES "${tId}".support_tickets(ticket_id) ON DELETE CASCADE,
            user_id INTEGER,
            comment TEXT NOT NULL,
            is_internal BOOLEAN DEFAULT false,
            attachment_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${tId}".ai_logs (
            log_id SERIAL PRIMARY KEY,
            chat_id INTEGER REFERENCES "${tId}".support_chats(chat_id) ON DELETE CASCADE,
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

          CREATE TABLE IF NOT EXISTS "${tId}".canned_replies (
            reply_id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(100),
            shortcuts JSONB DEFAULT '[]'::jsonb,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${tId}".support_notification_prefs (
            pref_id SERIAL PRIMARY KEY,
            user_id INTEGER,
            email_new_ticket BOOLEAN DEFAULT true,
            email_ticket_update BOOLEAN DEFAULT true,
            email_chat_assigned BOOLEAN DEFAULT true,
            email_escalation BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        } catch (tErr) {
          console.warn(`Support schema notice for ${tId}:`, tErr.message);
        }
      }
      console.log('✅ Support module schemas verified across all tenant schemas.');
    } catch (err) {
      console.error('⚠️ Support module auto-migration notice:', err.message);
    }

    console.log('✅ Database auto-migration completed successfully.');
  } catch (err) {
    console.error('⚠️ Database auto-migration notice:', err.message);
  } finally {
    client.release();
  }
}

module.exports = autoMigrate;
