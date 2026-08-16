require('dotenv').config();
const axios = require('axios');
const { pool } = require('../config/database');

const API_BASE = 'http://localhost:5001/api';

async function testProfileAndNotifications() {
  console.log('=== Testing Profile & Notification Settings Resilience ===\n');

  // 1. Super Admin Login
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'info@hrmspro.online',
    password: 'Hrmspro@123'
  });
  
  const token = loginRes.data.data?.token;
  console.log('1. Super Admin Login status:', loginRes.status, 'token received:', Boolean(token));

  // 2. GET /api/auth/profile for Super Admin
  const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('2. GET /api/auth/profile status:', profileRes.status, 'email:', profileRes.data.data?.email);

  // 3. GET /api/notifications/settings for Super Admin (no tenant header)
  const notifSettingsRes = await axios.get(`${API_BASE}/notifications/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('3. GET /api/notifications/settings status:', notifSettingsRes.status, notifSettingsRes.data);

  // 3b. GET /api/tenants/active-broadcasts
  const broadcastsRes = await axios.get(`${API_BASE}/tenants/active-broadcasts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('3b. GET /api/tenants/active-broadcasts status:', broadcastsRes.status, broadcastsRes.data);

  // 4. Test Tenant Owner without employee row
  // Create test tenant
  const tenantId = `tenant_prof_${Date.now().toString().slice(-4)}`;
  await axios.post(`${API_BASE}/tenants`, {
    tenantId,
    name: 'Resilient Profile Org',
    adminEmail: `admin_${tenantId}@test.org`,
    adminPassword: 'Password@123',
    subscription_plan: 'free'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Login as Tenant Admin
  const tenantLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: `admin_${tenantId}@test.org`,
    password: 'Password@123'
  }, {
    headers: { 'x-tenant-id': tenantId }
  });

  const tenantToken = tenantLoginRes.data.data?.token;
  console.log('\n4. Tenant Admin Login status:', tenantLoginRes.status);

  // Delete employee record (simulating standalone workspace owner)
  await pool.query(`DELETE FROM "${tenantId}".employees`);

  // GET /api/auth/profile for standalone owner
  const ownerProfileRes = await axios.get(`${API_BASE}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${tenantToken}`,
      'x-tenant-id': tenantId
    }
  });
  console.log('5. GET /api/auth/profile for standalone owner:', ownerProfileRes.status, ownerProfileRes.data.data?.email);

  // Clean up
  await pool.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);
  await pool.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [tenantId]);

  console.log('\n✅ ALL PROFILE & NOTIFICATION ENDPOINTS TESTED AND VERIFIED RESILIENT 100%!');
  process.exit(0);
}

testProfileAndNotifications().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
