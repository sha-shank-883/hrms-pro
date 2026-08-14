const { pool } = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Tenant Contact, Billing & Payments Migration ---');

    await client.query('BEGIN');

    // 1. Add contact and billing fields to shared.tenants
    await client.query(`
      ALTER TABLE shared.tenants 
      ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS billing_address TEXT,
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
      ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(10) DEFAULT 'INR',
      ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
    `);
    console.log('✅ Contact & billing columns verified in shared.tenants');

    // 2. Create or alter shared.payment_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.payment_logs (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
        plan_id VARCHAR(50) NOT NULL,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        gateway VARCHAR(50) NOT NULL DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE shared.payment_logs
        ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed',
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS billing_period_start TIMESTAMP,
        ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ shared.payment_logs table verified and enhanced with missing columns');

    // 3. Create indexes for quick lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_logs_tenant_id ON shared.payment_logs(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON shared.payment_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON shared.payment_logs(status);
    `);
    console.log('✅ Indexes created for payment logs');

    // 4. Populate sample billing contact info for existing default tenant if empty
    await client.query(`
      UPDATE shared.tenants 
      SET 
        contact_person = COALESCE(contact_person, 'Shashank Admin'),
        contact_email = COALESCE(contact_email, 'info@hrmspro.online'),
        contact_phone = COALESCE(contact_phone, '+91 98765 43210'),
        billing_address = COALESCE(billing_address, 'Tech Park, Sector 62'),
        city = COALESCE(city, 'Noida'),
        country = COALESCE(country, 'India'),
        tax_id = COALESCE(tax_id, '07AAAAA0000A1Z5')
      WHERE tenant_id = 'tenant_default';
    `);

    // 5. Seed sample initial invoice log for default tenant if none exists
    const existingLogs = await client.query('SELECT id FROM shared.payment_logs LIMIT 1');
    if (existingLogs.rows.length === 0) {
      await client.query(`
        INSERT INTO shared.payment_logs 
          (tenant_id, plan_id, amount, currency, gateway, transaction_id, invoice_number, status, notes, billing_period_start, billing_period_end)
        VALUES 
          ('tenant_default', 'scale', 7990.00, 'INR', 'manual_wire', 'TXN_INIT_001', 'INV-2026-0001', 'completed', 'Initial Annual Subscription via Direct Wire Transfer', NOW() - INTERVAL '15 days', NOW() + INTERVAL '350 days')
      `);
      console.log('✅ Initial seed invoice created for tenant_default');
    }

    await client.query('COMMIT');
    console.log('--- Migration Completed Successfully ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
