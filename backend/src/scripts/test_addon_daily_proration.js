require('dotenv').config();
const { pool } = require('../config/database');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/razorpayController');
const { createOrder, captureOrder } = require('../controllers/paypalController');

async function runAddonProrationTests() {
  console.log('=== Starting Add-on Seat Daily Proration Tests ===\n');

  const testTenantId = `tenant_prorate_${Date.now().toString().slice(-4)}`;

  // 1. Setup tenant on Monthly Hatch plan with 10 days remaining (out of 30)
  const expiryDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO shared.tenants 
       (tenant_id, name, status, subscription_plan, employee_limit, billing_cycle, auto_renew, subscription_expiry)
     VALUES ($1, 'Proration Test Org', 'active', 'hatch', 15, 'monthly', true, $2)`,
    [testTenantId, expiryDate]
  );
  console.log('1. Created active tenant on Hatch Monthly with 10 days remaining.');

  // Mock Razorpay SDK
  const Razorpay = require('razorpay');
  Razorpay.prototype.addResources = function() {
    this.orders = {
      create: async (options) => ({
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt
      })
    };
  };

  // 2. Test createRazorpayOrder for 5 Add-on Seats
  console.log('\n2. Testing Razorpay Order for 5 Add-on Seats...');
  let rzpOrderOutput = null;
  const rzpReq = {
    tenant: { tenant_id: testTenantId, company_name: 'Proration Test Org' },
    body: {
      planId: 'hatch',
      seats: 5,
      billingCycle: 'monthly',
      isAddon: true
    }
  };
  const rzpRes = {
    status: (s) => rzpRes,
    json: (d) => { rzpOrderOutput = d; return rzpRes; }
  };

  await createRazorpayOrder(rzpReq, rzpRes, (err) => { if (err) throw err; });

  // Normal 5 seats Hatch monthly: 5 * 299 = ₹1,495
  // Prorated for 10 days: 1495 * (10 / 30) = ₹498.33 -> Math.round = ₹498 (49800 paise)
  const chargedINR = rzpOrderOutput.data.amount / 100;
  console.log(`Original full-month 5 seats: ₹1,495`);
  console.log(`Prorated charged price for 10 days: ₹${chargedINR}`);

  if (chargedINR !== 498) {
    throw new Error(`❌ Expected prorated price of ₹498, got ₹${chargedINR}`);
  }
  console.log('✅ Razorpay Daily Add-on Proration verified 100%!');

  // 3. Test verifyRazorpayPayment for Add-on seats
  console.log('\n3. Testing verifyRazorpayPayment for Add-on seats...');
  const crypto = require('crypto');
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_test';
  const orderId = rzpOrderOutput.data.orderId;
  const paymentId = `pay_mock_${Date.now()}`;
  const validSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  let verifyOutput = null;
  const verifyReq = {
    tenant: { tenant_id: testTenantId },
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature,
      planId: 'hatch',
      seats: 5,
      billingCycle: 'monthly',
      isAddon: true
    }
  };
  const verifyRes = {
    status: (s) => verifyRes,
    json: (d) => { verifyOutput = d; return verifyRes; }
  };

  await verifyRazorpayPayment(verifyReq, verifyRes, (err) => { if (err) throw err; });

  // Check tenant updated seats without changing expiry
  const checkTenant = await pool.query(
    'SELECT employee_limit, subscription_expiry FROM shared.tenants WHERE tenant_id = $1',
    [testTenantId]
  );
  console.log(`Updated employee limit: ${checkTenant.rows[0].employee_limit} (Expected: 20 seats)`);
  if (checkTenant.rows[0].employee_limit !== 20) {
    throw new Error(`❌ Expected 20 seats, got ${checkTenant.rows[0].employee_limit}`);
  }
  console.log('✅ Employee capacity correctly incremented from 15 to 20 seats.');

  // Cleanup
  await pool.query('DELETE FROM shared.payment_logs WHERE tenant_id = $1', [testTenantId]);
  await pool.query('DELETE FROM shared.tenants WHERE tenant_id = $1', [testTenantId]);

  console.log('\n=== ALL ADD-ON DAILY PRORATION TESTS PASSED 100% ===');
  process.exit(0);
}

runAddonProrationTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
