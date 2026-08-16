require('dotenv').config();
const crypto = require('crypto');
const { pool } = require('../config/database');
const { verifyRazorpayPayment } = require('../controllers/razorpayController');
const { getProfile } = require('../controllers/authController');

async function testDirect() {
  console.log('=== Running Direct Controller Unit Test ===\n');

  const testTenantId = `tenant_direct_${Date.now().toString().slice(-4)}`;
  
  // 1. Insert test tenant
  await pool.query(
    `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan, employee_limit)
     VALUES ($1, 'Direct Test Org', 'active', 'free', 10)`,
    [testTenantId]
  );

  // 2. Create tenant schema & user
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
    VALUES ('admin_${testTenantId}@direct.org', 'hash123', 'admin', 'Owner', 'Direct');
  `);

  // 3. Execute verifyRazorpayPayment directly
  const orderId = 'order_' + Date.now();
  const paymentId = 'pay_' + Date.now();
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'YourRazorpaySecretKeyHere';
  const signature = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');

  const reqVerify = {
    tenant: { tenant_id: testTenantId, company_name: 'Direct Test Org' },
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      planId: 'scale',
      seats: 50,
      billingCycle: 'yearly',
      autoPay: true
    }
  };

  let verifyOutput = null;
  const resVerify = {
    json: (data) => { verifyOutput = data; return resVerify; },
    status: () => resVerify
  };

  await verifyRazorpayPayment(reqVerify, resVerify, (err) => { if (err) throw err; });
  console.log('✅ verifyRazorpayPayment Result:', verifyOutput);

  // 4. Execute getProfile directly
  const reqProfile = {
    user: { userId: 1, email: `admin_${testTenantId}@direct.org`, role: 'admin' },
    headers: { 'x-tenant-id': testTenantId }
  };

  let profileOutput = null;
  const resProfile = {
    json: (data) => { profileOutput = data; return resProfile; },
    status: () => resProfile
  };

  await getProfile(reqProfile, resProfile, (err) => { if (err) throw err; });
  console.log('\n✅ getProfile Result:');
  console.log('Plan:', profileOutput.data.subscription_plan);
  console.log('Employee Limit:', profileOutput.data.employee_limit);
  console.log('Billing Cycle:', profileOutput.data.billing_cycle);
  console.log('Auto Renew:', profileOutput.data.auto_renew);
  console.log('VIP Badge:', profileOutput.data.plan_badge);

  // 5. Cleanup
  await pool.query(`DROP SCHEMA IF EXISTS "${testTenantId}" CASCADE`);
  await pool.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [testTenantId]);
  await pool.query(`DELETE FROM shared.payment_logs WHERE tenant_id = $1`, [testTenantId]);

  console.log('\n=== DIRECT UNIT TEST 100% SUCCESSFUL ===');
  process.exit(0);
}

testDirect().catch(err => {
  console.error('Direct test error:', err);
  process.exit(1);
});
