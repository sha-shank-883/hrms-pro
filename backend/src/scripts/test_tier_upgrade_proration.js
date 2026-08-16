require('dotenv').config();
const { pool } = require('../config/database');
const { createRazorpayOrder } = require('../controllers/razorpayController');

async function runTierUpgradeAndProrationTests() {
  console.log('=== Starting Tier Upgrade & Proration Tests ===\n');

  const testTenantId = `tenant_pror_${Date.now().toString().slice(-4)}`;

  // 1. Setup tenant on active Hatch plan (15 seats, yearly, expires in 200 days)
  await pool.query(
    `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan, employee_limit, billing_cycle, auto_renew, subscription_expiry)
     VALUES ($1, 'Upgrade Test Org', 'active', 'hatch', 15, 'yearly', true, NOW() + INTERVAL '200 days')`,
    [testTenantId]
  );
  console.log('1. Created active tenant on Hatch plan with 15 seats, 200 days remaining.');

  // Mock Request Object
  const reqUpgrade = {
    tenant: { tenant_id: testTenantId, company_name: 'Upgrade Test Org' },
    body: {
      planId: 'scale',
      seats: 25,
      billingCycle: 'yearly',
      isAddon: false
    }
  };

  // Mock Response
  let upgradeOrderOutput = null;
  const resUpgrade = {
    status: (code) => resUpgrade,
    json: (d) => { upgradeOrderOutput = d; return resUpgrade; }
  };

  // Mock Razorpay instance on global / SDK
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

  // 2. Test createRazorpayOrder for Tier Upgrade (Hatch -> Scale)
  console.log('\n2. Testing Tier Upgrade Order (Hatch -> Scale)...');
  await createRazorpayOrder(reqUpgrade, resUpgrade, (err) => { if (err) throw err; });

  if (!upgradeOrderOutput || !upgradeOrderOutput.success) {
    throw new Error('❌ Failed to create upgrade order');
  }

  const { totalPrice, originalPrice, proratedCredit, isUpgrade } = upgradeOrderOutput.data;
  console.log(`Original Scale Plan Price: ₹${originalPrice}`);
  console.log(`Prorated Hatch Plan Credit: -₹${proratedCredit}`);
  console.log(`Final Payable Amount: ₹${totalPrice}`);
  console.log(`Is Upgrade Flag: ${isUpgrade}`);

  if (!isUpgrade) {
    throw new Error('❌ isUpgrade flag should be true');
  }
  if (proratedCredit <= 0) {
    throw new Error('❌ Prorated credit should be greater than 0');
  }
  if (totalPrice !== originalPrice - proratedCredit) {
    throw new Error(`❌ Final payable (₹${totalPrice}) does not match expected (₹${originalPrice - proratedCredit})`);
  }
  console.log('✅ Prorated difference calculation verified 100%!');

  // 3. Test Downgrade Protection (Scale -> Hatch)
  console.log('\n3. Testing Downgrade Protection (Upgraded Scale tenant trying to buy Hatch)...');
  // Update tenant to scale
  await pool.query(`UPDATE shared.tenants SET subscription_plan = 'scale' WHERE tenant_id = $1`, [testTenantId]);

  const reqDowngrade = {
    tenant: { tenant_id: testTenantId, company_name: 'Upgrade Test Org' },
    body: {
      planId: 'hatch',
      seats: 15,
      billingCycle: 'yearly',
      isAddon: false
    }
  };

  let downgradeBlocked = false;
  try {
    await createRazorpayOrder(reqDowngrade, resUpgrade, (err) => {
      if (err) throw err;
    });
  } catch (err) {
    if (err.message && err.message.includes('Downgrading is not permitted')) {
      downgradeBlocked = true;
      console.log(`✅ Downgrade correctly blocked: "${err.message}"`);
    } else {
      throw err;
    }
  }

  if (!downgradeBlocked) {
    throw new Error('❌ Downgrade was not blocked!');
  }

  // Cleanup test tenant
  await pool.query(`DELETE FROM shared.payment_logs WHERE tenant_id = $1`, [testTenantId]);
  await pool.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [testTenantId]);

  console.log('\n=== ALL TIER UPGRADE & PRORATION TESTS PASSED 100% ===');
  process.exit(0);
}

runTierUpgradeAndProrationTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
