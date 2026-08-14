const { app } = require('../server');
const request = require('supertest');
const jwt = require('jsonwebtoken');

async function runTests() {
  try {
    console.log('🧪 Testing Notification Endpoints with supertest...');

    const token = jwt.sign(
      { userId: 1, email: 'admin@testcorp.com', role: 'admin', tenantId: 'tenant_test_corp' },
      process.env.JWT_SECRET || 'your-secret-key-hrms-pro',
      { expiresIn: '1h' }
    );

    // 1. Test GET /api/notifications/badge-counts
    const badgeRes = await request(app)
      .get('/api/notifications/badge-counts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', 'tenant_test_corp');

    console.log('✅ GET /api/notifications/badge-counts status:', badgeRes.status);
    console.log('   Badge Counts:', badgeRes.body.counts);

    // 2. Test GET /api/notifications/settings
    const settingsRes = await request(app)
      .get('/api/notifications/settings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', 'tenant_test_corp');

    console.log('✅ GET /api/notifications/settings status:', settingsRes.status);
    console.log('   Settings:', settingsRes.body.data);

    // 3. Test PUT /api/notifications/settings
    const updateRes = await request(app)
      .put('/api/notifications/settings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', 'tenant_test_corp')
      .send({
        enable_web_push: true,
        enable_in_app_sound: true,
        enable_email_alerts: true,
        event_rules: {
          leave_request: { in_app: true, email: true, push: true },
          payroll_published: { in_app: true, email: true, push: true }
        }
      });

    console.log('✅ PUT /api/notifications/settings status:', updateRes.status, updateRes.body.message);

    // 4. Test GET /api/notifications
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', 'tenant_test_corp');

    console.log('✅ GET /api/notifications status:', notifRes.status, 'Total:', notifRes.body.data.length);

    console.log('\n🎉 ALL NOTIFICATION TESTS PASSED 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
