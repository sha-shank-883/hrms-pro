require('dotenv').config();
const axios = require('axios');
const { pool } = require('../config/database');

const API_BASE = 'http://localhost:5001/api';

async function testTenantRecoveryAndDeleteProtection() {
  console.log('=== Testing Tenant Owner Recovery & Employee Delete Protection ===\n');

  const randomId = Date.now().toString().slice(-4);
  const testEmail = `owner_${randomId}@phoenixsystems.org`;
  const testPassword = 'Password@123';

  // 1. Sign up tenant
  console.log('1. Provisioning tenant company...');
  const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
    companyName: `Phoenix Systems ${randomId}`,
    fullName: 'Lucas Vance',
    email: testEmail,
    password: testPassword,
    phone: '+91 9888877777'
  });

  const tenantId = signupRes.data.data?.tenant?.tenantId;
  const token = signupRes.data.data?.token;
  console.log('✅ Workspace created:', tenantId);

  // 2. Add an employee that links to this admin or regular employee
  console.log('\n2. Creating an employee in the company...');
  const empRes = await axios.post(`${API_BASE}/employees`, {
    first_name: 'Lucas',
    last_name: 'Vance',
    email: `staff_${randomId}@phoenixsystems.org`,
    position: 'Lead Architect',
    hire_date: '2026-08-01',
    salary: 95000
  }, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  const empId = empRes.data.data?.employee_id;
  console.log('✅ Employee created ID:', empId);

  // 3. Delete this employee using DELETE /api/employees/:id
  console.log('\n3. Deleting employee record...');
  const deleteRes = await axios.delete(`${API_BASE}/employees/${empId}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  console.log('✅ Delete response:', deleteRes.data);

  // 4. Verify Admin user still exists in users table and can log in
  console.log('\n4. Verifying Admin user can log in after employee deletion...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: testPassword
  });
  console.log('✅ Admin Logged in successfully:', {
    email: loginRes.data.data?.user?.email,
    role: loginRes.data.data?.user?.role,
    tenant_id: loginRes.data.data?.user?.tenant_id
  });

  // 5. Test Auto-Restoration Scenario (simulating old bug where admin was wiped from users table)
  console.log('\n5. Simulating accidental deletion of admin from users table...');
  await pool.query(`DELETE FROM "${tenantId}".users WHERE email = $1`, [testEmail]);
  console.log('Admin user deleted from users table.');

  // Try to log in - Auto-Restoration should kick in seamlessly!
  console.log('Logging in with owner email (testing auto-restoration)...');
  const recoveryLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: testPassword
  });
  console.log('✅ Auto-Restoration Succeeded! Logged in as:', {
    email: recoveryLoginRes.data.data?.user?.email,
    role: recoveryLoginRes.data.data?.user?.role,
    tenant_id: recoveryLoginRes.data.data?.user?.tenant_id
  });

  console.log('\n=== COMPLETE TENANT OWNER RECOVERY & PROTECTION VERIFIED 100% ===');
  process.exit(0);
}

testTenantRecoveryAndDeleteProtection().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
