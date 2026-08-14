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
    `);

    // 4. Ensure shared.plan_configs
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

    console.log('✅ Database auto-migration completed successfully.');
  } catch (err) {
    console.error('⚠️ Database auto-migration notice:', err.message);
  } finally {
    client.release();
  }
}

module.exports = autoMigrate;
