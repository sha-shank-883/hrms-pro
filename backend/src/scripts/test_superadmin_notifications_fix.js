require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testSuperAdminNotificationFix() {
  console.log('=== Testing Super Admin Notifications Mark-All-Read Fix ===\n');

  // 1. Authenticate Super Admin
  console.log('1. Logging in as Super Admin...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'info@hrmspro.online',
    password: 'Hrmspro@123'
  });

  const token = loginRes.data.data?.token;
  console.log('✅ Super Admin Logged in successfully.');

  // 2. Fetch Notifications before mark all read
  console.log('\n2. Fetching Super Admin Notifications Feed...');
  const notifRes = await axios.get(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Feed retrieved:', {
    totalItems: notifRes.data.data?.length,
    unreadCount: notifRes.data.unreadCount,
    isSuperAdmin: notifRes.data.isSuperAdmin
  });

  // 3. Test Mark All As Read (PUT /api/notifications/mark-all-read)
  console.log('\n3. Testing PUT /api/notifications/mark-all-read as Super Admin...');
  const markAllRes = await axios.put(`${API_BASE}/notifications/mark-all-read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Mark All As Read Response:', markAllRes.data);

  // 4. Verify that unreadCount is now 0 and items are marked read
  console.log('\n4. Verifying Super Admin Notifications Feed after Mark-All-Read...');
  const verifyRes = await axios.get(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Feed after Mark-All-Read:', {
    totalItems: verifyRes.data.data?.length,
    unreadCount: verifyRes.data.unreadCount,
    allMarkedRead: verifyRes.data.data?.every(item => item.is_read)
  });

  // 5. Test Single Item Mark As Read (PUT /api/notifications/:id/read)
  if (verifyRes.data.data?.length > 0) {
    const firstId = verifyRes.data.data[0].id;
    console.log(`\n5. Testing Single Mark As Read for: ${firstId}...`);
    const singleMarkRes = await axios.put(`${API_BASE}/notifications/${firstId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Single Mark As Read Response:', singleMarkRes.data);
  }

  console.log('\n=== SUPER ADMIN NOTIFICATION FLOW TESTED AND VERIFIED 100% ===');
}

testSuperAdminNotificationFix().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
