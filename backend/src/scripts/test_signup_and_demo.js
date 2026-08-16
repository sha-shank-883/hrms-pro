require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testSignupAndDemoFlow() {
  console.log('=== Testing Signup vs Get Demo Workflows ===\n');

  const randomId = Date.now().toString().slice(-4);
  const testCompanyName = `Apex Innovations ${randomId}`;
  const testEmail = `founder_${randomId}@apexinnovations.com`;
  const testPassword = 'SecurePassword@123';

  // 1. TEST SELF-SERVE SIGNUP (Instant Workspace Provisioning)
  console.log('1. Testing Self-Serve Sign Up (POST /api/auth/signup)...');
  const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
    companyName: testCompanyName,
    fullName: 'Alexander Pierce',
    email: testEmail,
    password: testPassword,
    phone: '+91 9876543210'
  });

  console.log('✅ Signup Response:', {
    success: signupRes.data.success,
    message: signupRes.data.message,
    tenantId: signupRes.data.data?.tenant?.tenantId,
    plan: signupRes.data.data?.tenant?.plan,
    trialExpires: signupRes.data.data?.tenant?.trialExpires,
    tokenReceived: Boolean(signupRes.data.data?.token)
  });

  const tenantId = signupRes.data.data?.tenant?.tenantId;

  // Inspect database directly
  const { pool } = require('../config/database');
  const tCheck = await pool.query('SELECT * FROM shared.tenants WHERE tenant_id = $1', [tenantId]);
  console.log('DB Tenant Record:', tCheck.rows[0]);
  const uCheck = await pool.query(`SELECT * FROM "${tenantId}".users`);
  console.log('DB Tenant Users:', uCheck.rows);

  // 2. TEST INSTANT LOGIN WITH THE NEWLY SIGNED UP ACCOUNT (Auto Tenant Resolution)
  console.log('\n2. Testing Login for newly registered user without specifying x-tenant-id...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: testPassword
  });

  console.log('✅ Login Response:', {
    success: loginRes.data.success,
    resolvedTenantId: loginRes.data.data?.user?.tenant_id,
    role: loginRes.data.data?.user?.role,
    plan: loginRes.data.data?.user?.subscription_plan
  });

  // 3. TEST GET DEMO / SALES LEAD INQUIRY (POST /api/leads/demo)
  console.log('\n3. Testing Get Demo Lead Submission (POST /api/leads/demo)...');
  const demoEmail = `sales_lead_${randomId}@prospectenterprise.com`;
  const demoRes = await axios.post(`${API_BASE}/leads/demo`, {
    name: 'Eleanor Vance',
    email: demoEmail,
    company_name: `Vance Global ${randomId}`,
    phone: '+1 555-4321',
    password: 'LeadPassword@123'
  });

  console.log('✅ Demo Lead Response:', demoRes.data);

  console.log('\n=== BOTH SIGNUP & GET DEMO TESTED AND VERIFIED SUCCESSFULLY ===');
}

testSignupAndDemoFlow().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
