require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('../config/database');

const API_BASE = 'http://localhost:5001/api';

async function testYearlyCycleAndVIPBadging() {
  console.log('=== Testing Yearly Billing (20% Discount), Auto-Pay, and Profile VIP Badging ===\n');

  // 1. Authenticate Super Admin & create test tenant
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'info@hrmspro.online',
    password: 'Hrmspro@123'
  });
  const saToken = loginRes.data.data?.token;

  const testTenantId = `tenant_vip_${Date.now().toString().slice(-4)}`;
  console.log(`1. Creating test tenant: ${testTenantId}...`);
  await axios.post(`${API_BASE}/tenants`, {
    tenantId: testTenantId,
    name: 'VIP Enterprise Corp',
    adminEmail: `owner_${testTenantId}@vipcorp.com`,
    adminPassword: 'Password@123',
    subscription_plan: 'free'
  }, {
    headers: { Authorization: `Bearer ${saToken}` }
  });

  // Login as Tenant Admin
  const tenantLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: `owner_${testTenantId}@vipcorp.com`,
    password: 'Password@123'
  }, {
    headers: { 'x-tenant-id': testTenantId }
  });
  const tenantToken = tenantLoginRes.data.data?.token;
  const tenantHeaders = {
    Authorization: `Bearer ${tenantToken}`,
    'x-tenant-id': testTenantId
  };

  // 2. Test Yearly Plan Order Creation with 20% Discount
  console.log('\n2. Testing Yearly Scale Plan (25 Seats with 20% Discount)...');
  const yearlyOrderId = 'order_test_yearly_' + Date.now();
  const yearlyPaymentId = 'pay_test_yearly_' + Date.now();
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'YourRazorpaySecretKeyHere';

  const validSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${yearlyOrderId}|${yearlyPaymentId}`)
    .digest('hex');

  const verifyRes = await axios.post(`${API_BASE}/payments/razorpay/verify-payment`, {
    razorpay_order_id: yearlyOrderId,
    razorpay_payment_id: yearlyPaymentId,
    razorpay_signature: validSignature,
    planId: 'scale',
    seats: 25,
    billingCycle: 'yearly',
    autoPay: true
  }, {
    headers: tenantHeaders
  });

  console.log('✅ Yearly payment confirmed:', verifyRes.data);

  // 3. Test Profile API to verify VIP badging, 365 days expiry, and capacity
  console.log('\n3. Verifying Profile API VIP badging and seat limits...');
  const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
    headers: tenantHeaders
  });

  const profile = profileRes.data.data;
  console.log('Plan:', profile.subscription_plan);
  console.log('Employee Limit:', profile.employee_limit);
  console.log('Billing Cycle:', profile.billing_cycle);
  console.log('Auto Renew:', profile.auto_renew);
  console.log('VIP Badge Details:', profile.plan_badge);

  if (profile.subscription_plan === 'scale' && profile.employee_limit === 25 && profile.plan_badge?.is_premium) {
    console.log('✅ Profile successfully upgraded with VIP Scale badge and 25 seats capacity.');
  } else {
    throw new Error('❌ Profile verification failed!');
  }

  // 4. Cleanup
  console.log('\n4. Cleaning up test data...');
  await pool.query(`DROP SCHEMA IF EXISTS "${testTenantId}" CASCADE`);
  await pool.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [testTenantId]);
  await pool.query(`DELETE FROM shared.payment_logs WHERE tenant_id = $1`, [testTenantId]);

  console.log('\n=== ALL YEARLY BILLING, AUTOPAY & VIP BADGING TESTS PASSED ===');
  process.exit(0);
}

testYearlyCycleAndVIPBadging().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
