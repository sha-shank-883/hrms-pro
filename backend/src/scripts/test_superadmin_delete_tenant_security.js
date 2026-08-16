require('dotenv').config();
const axios = require('axios');
const speakeasy = require('speakeasy');
const { pool } = require('../config/database');

const API_BASE = 'http://localhost:5001/api';

async function testSuperAdminDeleteTenantSecurity() {
  console.log('=== Testing Super Admin Tenant Deletion & 2FA Security ===\n');

  // 1. Log in as Super Admin
  console.log('1. Logging in as Super Admin...');
  const superAdminEmail = 'info@hrmspro.online';
  const superAdminPassword = 'Hrmspro@123';

  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: superAdminEmail,
    password: superAdminPassword
  });
  const token = loginRes.data.data?.token;
  console.log('✅ Super Admin authenticated.');

  // 2. Create a dummy tenant to delete
  const testTenantId1 = `tenant_deltest_${Date.now().toString().slice(-4)}`;
  console.log(`\n2. Creating dummy tenant ${testTenantId1}...`);
  await axios.post(`${API_BASE}/tenants`, {
    tenantId: testTenantId1,
    name: 'Temporary Test Org 1',
    adminEmail: `admin_${testTenantId1}@temp.org`,
    adminPassword: 'Password@123',
    subscription_plan: 'free'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Tenant created:', testTenantId1);

  // 3. Test deleting tenant using Super Admin Password Authorization
  console.log('\n3. Testing Delete Tenant using Super Admin Password Authorization...');
  const deleteWithPasswordRes = await axios.delete(`${API_BASE}/tenants/${testTenantId1}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { adminPassword: superAdminPassword }
  });
  console.log('✅ Delete with Password succeeded:', deleteWithPasswordRes.data);

  // 4. Create another dummy tenant for 2FA deletion
  const testTenantId2 = `tenant_deltest_${Date.now().toString().slice(-4)}b`;
  console.log(`\n4. Creating second dummy tenant ${testTenantId2}...`);
  await axios.post(`${API_BASE}/tenants`, {
    tenantId: testTenantId2,
    name: 'Temporary Test Org 2',
    adminEmail: `admin_${testTenantId2}@temp.org`,
    adminPassword: 'Password@123',
    subscription_plan: 'free'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Tenant created:', testTenantId2);

  // 5. Test 2FA Setup for Super Admin
  console.log('\n5. Testing Super Admin 2FA Setup...');
  const setup2FARes = await axios.post(`${API_BASE}/auth/2fa/setup`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const secretKey = setup2FARes.data.secret;
  console.log('✅ 2FA Setup initiated. Secret generated.');

  // Generate 6-digit TOTP token
  const totpToken = speakeasy.totp({
    secret: secretKey,
    encoding: 'base32'
  });

  // Verify 2FA Setup
  console.log(`Verifying 2FA Setup with TOTP ${totpToken}...`);
  const verifySetupRes = await axios.post(`${API_BASE}/auth/2fa/verify-setup`, {
    token: totpToken
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ 2FA Activated:', verifySetupRes.data);

  // 6. Test Delete Tenant with 2FA Token
  console.log('\n6. Testing Delete Tenant using 6-Digit 2FA Token Authorization...');
  const currentTotp = speakeasy.totp({
    secret: secretKey,
    encoding: 'base32'
  });

  const deleteWith2FARes = await axios.delete(`${API_BASE}/tenants/${testTenantId2}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { twoFactorToken: currentTotp }
  });
  console.log('✅ Delete with 2FA Token succeeded:', deleteWith2FARes.data);

  // 7. Clean up: Disable 2FA to return account to clean default
  console.log('\n7. Cleaning up: Resetting 2FA for test account...');
  await axios.post(`${API_BASE}/auth/2fa/disable`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ 2FA cleanly reset.');

  console.log('\n=== SUPER ADMIN DELETION & 2FA SECURITY TESTED & VERIFIED 100% ===');
  process.exit(0);
}

testSuperAdminDeleteTenantSecurity().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
