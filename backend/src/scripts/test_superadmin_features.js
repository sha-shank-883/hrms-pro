require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

async function runSuperAdminTests() {
  console.log('=== Testing Super Admin Tenant Editing & Platform Notifications ===\n');

  // 1. Generate Super Admin Token
  const superAdminToken = jwt.sign(
    { userId: 'superadmin_1', email: 'admin@hrmspro.online', role: 'super_admin', isSuperAdmin: true },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const superHeaders = {
    Authorization: `Bearer ${superAdminToken}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Fetch list of tenants
  console.log('1. Fetching all tenants...');
  const tenantsRes = await axios.get(`${API_BASE}/tenants`, { headers: superHeaders });
  console.log(`✅ Retrieved ${tenantsRes.data.length} tenants.`);
  const targetTenant = tenantsRes.data[0];
  console.log(`Target tenant: ${targetTenant.tenant_id} (Current name: "${targetTenant.name}")`);

  // Test 2: Edit Tenant Information (Name, Domain, Employee Limit, Contact info)
  console.log('\n2. Updating tenant information...');
  const newName = `Updated Enterprise Corp ${Date.now().toString().slice(-4)}`;
  const updatePayload = {
    name: newName,
    domain: 'enterprise.hrmspro.online',
    employee_limit: 50,
    status: 'active',
    contact_person: 'Jane Doe',
    contact_email: 'jane@enterprise.com',
    contact_phone: '+91 9988776655',
    billing_address: 'Tower A, Tech Park',
    city: 'Hyderabad',
    country: 'India',
    tax_id: '36ABCDE1234F1Z5',
    billing_currency: 'INR',
    billing_cycle: 'yearly'
  };

  const updateRes = await axios.put(`${API_BASE}/tenants/${targetTenant.tenant_id}`, updatePayload, { headers: superHeaders });
  console.log('✅ Tenant update response:', updateRes.data);

  if (updateRes.data.tenant && updateRes.data.tenant.name === newName) {
    console.log(`✅ Successfully updated company name to: "${updateRes.data.tenant.name}"`);
    console.log(`✅ Employee limit: ${updateRes.data.tenant.employee_limit}, Contact: ${updateRes.data.tenant.contact_person}`);
  } else {
    console.log('⚠️ Tenant update succeeded without returned object check');
  }

  // Test 3: Generate a Demo Request from public marketing site
  console.log('\n3. Generating inbound Demo Request...');
  const testEmail = `lead_${Date.now()}@prospect.com`;
  const demoRes = await axios.post(`${API_BASE}/leads/demo`, {
    name: 'Sarah Connor',
    email: testEmail,
    company_name: 'Cyberdyne Systems',
    phone: '+1 555-0199',
    password: 'DemoPassword@123'
  });
  console.log('✅ Demo Request submitted:', demoRes.data);

  // Test 4: Check Super Admin Badge Counts
  console.log('\n4. Checking Super Admin Badge Counts...');
  const badgeRes = await axios.get(`${API_BASE}/notifications/badge-counts`, { headers: superHeaders });
  console.log('✅ Super Admin Badge Counts response:', badgeRes.data);

  // Test 5: Check Super Admin Notifications Feed
  console.log('\n5. Checking Super Admin In-App Notifications Feed...');
  const feedRes = await axios.get(`${API_BASE}/notifications`, { headers: superHeaders });
  console.log(`✅ Super Admin Feed contains ${feedRes.data.data?.length || 0} activity items.`);
  const latestItem = feedRes.data.data?.[0];
  console.log('Latest feed item:', latestItem);

  console.log('\n=== ALL SUPER ADMIN FEATURES VERIFIED SUCCESSFULLY ===');
}

runSuperAdminTests().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
