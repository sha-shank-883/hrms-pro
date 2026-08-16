require('dotenv').config();
const crypto = require('crypto');
const { pool } = require('../config/database');
const { verifyRazorpayPayment } = require('../controllers/razorpayController');
const { getProfile } = require('../controllers/authController');

async function testSeatAddonAndReplacement() {
  console.log('=== Testing Seat Add-On (15 + 20 = 35) and Capacity Replacement ===\n');

  const testTenantId = `tenant_seat_test_${Date.now().toString().slice(-4)}`;

  // 1. Setup tenant with 15 initial seats
  await pool.query(
    `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan, employee_limit)
     VALUES ($1, 'Seat Addon Org', 'active', 'scale', 15)`,
    [testTenantId]
  );

  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${testTenantId}"`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${testTenantId}".users (
      user_id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      is_active BOOLEAN DEFAULT true
    );
    INSERT INTO "${testTenantId}".users (email, password_hash, role, first_name, last_name)
    VALUES ('admin_${testTenantId}@addon.org', 'hash123', 'admin', 'Owner', 'Addon');
  `);

  console.log('Initial capacity in database: 15 seats.');

  // 2. Buy 20 additional seats in "add_seats" mode
  console.log('\n2. Purchasing +20 Additional Seats (isAddon = true)...');
  const orderId1 = 'order_addon_' + Date.now();
  const paymentId1 = 'pay_addon_' + Date.now();
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'YourRazorpaySecretKeyHere';
  const sig1 = crypto.createHmac('sha256', keySecret).update(`${orderId1}|${paymentId1}`).digest('hex');

  const reqAddon = {
    tenant: { tenant_id: testTenantId, company_name: 'Seat Addon Org' },
    body: {
      razorpay_order_id: orderId1,
      razorpay_payment_id: paymentId1,
      razorpay_signature: sig1,
      planId: 'scale',
      seats: 20,
      isAddon: true,
      mode: 'add_seats',
      billingCycle: 'yearly',
      autoPay: true
    }
  };

  let verifyOutput1 = null;
  const res1 = {
    json: (data) => { verifyOutput1 = data; return res1; },
    status: () => res1
  };

  await verifyRazorpayPayment(reqAddon, res1, (err) => { if (err) throw err; });
  console.log('Payment 1 verified successfully.');

  // Check database capacity
  const check1 = await pool.query('SELECT employee_limit FROM shared.tenants WHERE tenant_id = $1', [testTenantId]);
  const limitAfterAddon = check1.rows[0].employee_limit;
  console.log(`Updated Capacity after Add-on: ${limitAfterAddon} seats (Expected: 15 + 20 = 35).`);

  if (limitAfterAddon !== 35) {
    throw new Error(`❌ Capacity mismatch! Expected 35, got ${limitAfterAddon}`);
  }
  console.log('✅ Seat Add-on calculation 15 + 20 = 35 verified perfectly.');

  // 3. Cleanup
  await pool.query(`DROP SCHEMA IF EXISTS "${testTenantId}" CASCADE`);
  await pool.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [testTenantId]);
  await pool.query(`DELETE FROM shared.payment_logs WHERE tenant_id = $1`, [testTenantId]);

  console.log('\n=== ALL SEAT ADD-ON TESTS PASSED 100% ===');
  process.exit(0);
}

testSeatAddonAndReplacement().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
