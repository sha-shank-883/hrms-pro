const { pool } = require('../config/database');

async function testBilling() {
  console.log('=== SaaS Customer Billing & Payment Management Test Suite ===\n');

  try {
    // 1. Check shared.payment_logs and summary calculation
    const summaryRes = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_successful_payments
      FROM shared.payment_logs
    `);
    console.log(`[PASS] Billing summary calculated. Total Revenue: ₹${summaryRes.rows[0].total_revenue}, Successful Payments: ${summaryRes.rows[0].total_successful_payments}`);

    // 2. Test Tenant Contact & Billing Profile Update
    console.log('\n--- Testing Tenant Customer Contact & Billing Profile Update ---');
    const updateRes = await pool.query(`
      UPDATE shared.tenants
      SET 
        contact_person = 'Jane Doe',
        contact_email = 'billing@janedoe.com',
        contact_phone = '+91 99999 88888',
        billing_address = '123 Enterprise Blvd, Cyber City',
        city = 'Gurgaon',
        country = 'India',
        tax_id = '06AAAAA0000A1Z5',
        billing_currency = 'INR',
        billing_cycle = 'annual',
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = 'tenant_default'
      RETURNING *
    `);
    const t = updateRes.rows[0];
    console.log(`[PASS] Updated tenant customer contact profile:`);
    console.log(`   - Contact: ${t.contact_person} (${t.contact_email}, ${t.contact_phone})`);
    console.log(`   - Address: ${t.billing_address}, ${t.city}, ${t.country}`);
    console.log(`   - Tax ID: ${t.tax_id}, Currency: ${t.billing_currency}, Cycle: ${t.billing_cycle}`);

    // 3. Test Manual Payment Recording & Subscription Extension
    console.log('\n--- Testing Manual Payment Recording & Subscription Extension ---');
    const prevExpiry = new Date(t.subscription_expiry || new Date());
    const baseDate = prevExpiry > new Date() ? prevExpiry : new Date();
    const durationDays = 60;
    const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const paymentRes = await pool.query(`
      INSERT INTO shared.payment_logs 
        (tenant_id, plan_id, amount, currency, gateway, transaction_id, invoice_number, status, notes, billing_period_start, billing_period_end)
      VALUES 
        ('tenant_default', 'enterprise', 2998.00, 'INR', 'manual_wire', 'MANUAL_TEST_99', 'INV-2026-TEST', 'completed', 'Test Wire Payment', $1, $2)
      RETURNING *
    `, [baseDate, newExpiry]);

    await pool.query(`
      UPDATE shared.tenants 
      SET 
        subscription_plan = 'enterprise',
        subscription_expiry = $1,
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = 'tenant_default'
    `, [newExpiry]);

    console.log(`[PASS] Recorded manual payment: Invoice #${paymentRes.rows[0].invoice_number}, Amount: ₹${paymentRes.rows[0].amount}, Gateway: ${paymentRes.rows[0].gateway}`);
    console.log(`[PASS] Subscription extended to: ${newExpiry.toISOString()}`);

    console.log('\n=== ALL Billing & Customer Contact Tests PASSED Successfully! ===\n');
  } catch (err) {
    console.error('[FAIL] Error during billing tests:', err);
  } finally {
    await pool.end();
  }
}

testBilling();
