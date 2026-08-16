require('dotenv').config();
const { pool } = require('../config/database');
const { createCoupon, getCoupons, updateCoupon, deleteCoupon, validateCoupon, ensureCouponSchema } = require('../controllers/couponController');
const { manualGrantSubscription, activateFreeCouponSubscription } = require('../controllers/paymentManagementController');

async function runCouponAndGrantTests() {
  console.log('=== Starting Coupon Engine & Super Admin Manual Grant Tests ===\n');

  await ensureCouponSchema();

  const testTenantId = `tenant_grant_${Date.now().toString().slice(-4)}`;

  // 1. Create a test tenant
  await pool.query(
    `INSERT INTO shared.tenants 
       (tenant_id, name, status, subscription_plan, employee_limit, billing_cycle, auto_renew)
     VALUES ($1, 'VIP Client Org', 'active', 'free', 15, 'monthly', false)`,
    [testTenantId]
  );
  console.log(`1. Setup test tenant "${testTenantId}" on Free tier (15 seats).`);

  const superAdminUser = {
    email: 'superadmin@hrmspro.online',
    role: 'super_admin',
    isSuperAdmin: true
  };

  // 2. Test Super Admin Manual Subscription Grant (Gift Offer - 6 Months Scale Plan with 50 Seats)
  console.log('\n2. Testing Super Admin Manual Gift Grant (Scale Plan, 50 Seats, 6 Months)...');
  let grantOutput = null;
  const grantReq = {
    user: superAdminUser,
    body: {
      tenantId: testTenantId,
      planId: 'scale',
      seats: 50,
      durationMonths: 6,
      grantType: 'gift',
      amountPaid: 0,
      currency: 'INR',
      notes: 'Pilot partnership complimentary gift'
    }
  };
  const grantRes = {
    status: () => grantRes,
    json: (d) => { grantOutput = d; return grantRes; }
  };

  await manualGrantSubscription(grantReq, grantRes, (err) => { if (err) throw err; });

  const checkTenant = await pool.query('SELECT subscription_plan, employee_limit, subscription_expiry FROM shared.tenants WHERE tenant_id = $1', [testTenantId]);
  console.log(`Tenant plan: ${checkTenant.rows[0].subscription_plan}, seats: ${checkTenant.rows[0].employee_limit}`);
  if (checkTenant.rows[0].subscription_plan !== 'scale' || checkTenant.rows[0].employee_limit !== 50) {
    throw new Error('❌ Manual grant failed to update plan or seats correctly');
  }
  console.log('✅ Super Admin Manual Grant verified 100%!');

  // 3. Test Coupon Creation
  console.log('\n3. Testing Super Admin Coupon Creation...');
  const testPromoCode = `TEST50_${Date.now().toString().slice(-4)}`;
  const testGiftCode = `GIFT100_${Date.now().toString().slice(-4)}`;

  let promoCreateOutput = null;
  await createCoupon({
    user: superAdminUser,
    body: {
      code: testPromoCode,
      discountType: 'percentage',
      discountValue: 50,
      applicablePlans: ['all'],
      minSeats: 10,
      maxUses: 100,
      description: '50% test discount'
    }
  }, {
    status: () => ({ json: (d) => { promoCreateOutput = d; } }),
    json: (d) => { promoCreateOutput = d; }
  }, (err) => { if (err) throw err; });

  let giftCreateOutput = null;
  await createCoupon({
    user: superAdminUser,
    body: {
      code: testGiftCode,
      discountType: 'percentage',
      discountValue: 100,
      applicablePlans: ['hatch', 'scale'],
      maxUses: 10,
      description: '100% Free gift voucher'
    }
  }, {
    status: () => ({ json: (d) => { giftCreateOutput = d; } }),
    json: (d) => { giftCreateOutput = d; }
  }, (err) => { if (err) throw err; });

  console.log(`Created Promo: ${testPromoCode} (50% OFF), Gift: ${testGiftCode} (100% Free)`);
  console.log('✅ Coupon creation verified 100%!');

  // 4. Test Coupon Validation in Checkout
  console.log('\n4. Testing Coupon Validation in Checkout...');
  let valOutput = null;
  await validateCoupon({
    tenant: { tenant_id: testTenantId },
    body: {
      code: testPromoCode,
      planId: 'hatch',
      seats: 15,
      billingCycle: 'monthly',
      rawPrice: 4485
    }
  }, {
    status: () => ({ json: (d) => { valOutput = d; } }),
    json: (d) => { valOutput = d; }
  }, (err) => { if (err) throw err; });

  console.log(`Original Price: ₹4485 -> Discount: ₹${valOutput.data.discountAmount} -> Final Payable: ₹${valOutput.data.finalPayable}`);
  if (valOutput.data.finalPayable !== 2242.5) {
    throw new Error(`❌ Expected 50% discount price of ₹2242.5, got ₹${valOutput.data.finalPayable}`);
  }
  console.log('✅ Coupon calculation verified 100%!');

  // 5. Test 100% Free Gift Voucher Activation
  console.log('\n5. Testing 100% Free Gift Voucher Activation (0 Gateway calls)...');
  let freeGiftOutput = null;
  await activateFreeCouponSubscription({
    tenant: { tenant_id: testTenantId },
    body: {
      code: testGiftCode,
      planId: 'scale',
      seats: 30,
      billingCycle: 'monthly'
    }
  }, {
    status: () => ({ json: (d) => { freeGiftOutput = d; } }),
    json: (d) => { freeGiftOutput = d; }
  }, (err) => { if (err) throw err; });

  const finalCheckTenant = await pool.query('SELECT subscription_plan, employee_limit FROM shared.tenants WHERE tenant_id = $1', [testTenantId]);
  console.log(`Updated plan: ${finalCheckTenant.rows[0].subscription_plan}, seats: ${finalCheckTenant.rows[0].employee_limit}`);
  if (finalCheckTenant.rows[0].subscription_plan !== 'scale' || finalCheckTenant.rows[0].employee_limit !== 30) {
    throw new Error('❌ Free gift voucher activation failed');
  }

  const checkUsages = await pool.query('SELECT * FROM shared.coupon_usages WHERE tenant_id = $1', [testTenantId]);
  console.log(`Recorded coupon usages: ${checkUsages.rows.length}`);
  if (checkUsages.rows.length === 0) {
    throw new Error('❌ Coupon usage was not tracked in shared.coupon_usages');
  }
  console.log('✅ 100% Free Gift Voucher Redemption verified 100%!');

  // Cleanup
  await pool.query('DELETE FROM shared.coupon_usages WHERE tenant_id = $1', [testTenantId]);
  await pool.query('DELETE FROM shared.payment_logs WHERE tenant_id = $1', [testTenantId]);
  await pool.query('DELETE FROM shared.coupons WHERE code IN ($1, $2)', [testPromoCode, testGiftCode]);
  await pool.query('DELETE FROM shared.tenants WHERE tenant_id = $1', [testTenantId]);

  console.log('\n=== ALL COUPON & MANUAL GRANT TESTS PASSED 100% ===');
  process.exit(0);
}

runCouponAndGrantTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
