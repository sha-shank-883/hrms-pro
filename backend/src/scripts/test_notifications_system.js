const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testNotificationsSystem() {
  try {
    console.log('🧪 Starting Notifications System HTTP Test Suite...');

    const token = jwt.sign(
      { userId: 1, email: 'admin@testcorp.com', role: 'admin', tenantId: 'tenant_test_corp' },
      process.env.JWT_SECRET || 'your-secret-key-hrms-pro',
      { expiresIn: '1h' }
    );

    const headers = {
      Authorization: `Bearer ${token}`,
      'x-tenant-id': 'tenant_test_corp'
    };

    // 1. Get badge counts
    const badgeRes = await axios.get('http://localhost:5001/api/notifications/badge-counts', { headers });
    console.log('✅ GET /api/notifications/badge-counts: status', badgeRes.status, badgeRes.data.counts);

    // 2. Get notification settings
    const settingsRes = await axios.get('http://localhost:5001/api/notifications/settings', { headers });
    console.log('✅ GET /api/notifications/settings: status', settingsRes.status, settingsRes.data.data);

    // 3. Update notification settings
    const updateRes = await axios.put('http://localhost:5001/api/notifications/settings', {
      enable_web_push: true,
      enable_in_app_sound: true,
      enable_email_alerts: true,
      event_rules: {
        leave_request: { in_app: true, email: true, push: true },
        payroll_published: { in_app: true, email: true, push: true }
      }
    }, { headers });
    console.log('✅ PUT /api/notifications/settings: status', updateRes.status, updateRes.data.message);

    // 4. Get notifications list
    const notifRes = await axios.get('http://localhost:5001/api/notifications', { headers });
    console.log('✅ GET /api/notifications: status', notifRes.status, 'Total items:', notifRes.data.data.length);

    console.log('\n🎉 ALL NOTIFICATION ENDPOINTS TESTED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Notification test failed:', err.response?.status, err.response?.data || err.message);
  }
}

testNotificationsSystem();
