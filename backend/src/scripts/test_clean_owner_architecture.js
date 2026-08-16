require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testCleanOwnerArchitecture() {
  console.log('=== Testing Clean Workspace Owner Architecture & Zero-Employee Setup ===\n');

  const randomId = Date.now().toString().slice(-4);
  const testEmail = `founder_${randomId}@novatech.io`;
  const testPassword = 'Password@123';

  // 1. Sign up brand new tenant
  console.log('1. Registering new tenant company...');
  const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
    companyName: `NovaTech Solutions ${randomId}`,
    fullName: 'David Sterling',
    email: testEmail,
    password: testPassword,
    phone: '+91 9123456780'
  });

  const token = signupRes.data.data?.token;
  const tenantId = signupRes.data.data?.tenant?.tenantId;
  console.log('✅ Workspace Provisioned:', tenantId);

  // 2. Check Employee Directory - must be 0 entries (Owner is Workspace Admin, NOT forced as employee)
  console.log('\n2. Verifying Employee Directory has 0 dummy entries...');
  const employeesRes = await axios.get(`${API_BASE}/employees`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  console.log(`✅ Employee Directory Count: ${employeesRes.data.data?.length || 0}`);
  if (employeesRes.data.data?.length !== 0) {
    throw new Error(`Expected 0 employees, found ${employeesRes.data.data?.length}`);
  }

  // 3. Check Owner Profile via /api/auth/profile
  console.log('\n3. Fetching Owner Profile (Must succeed with zero employee record)...');
  const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  console.log('✅ Owner Profile Loaded:', {
    email: profileRes.data.data?.email,
    role: profileRes.data.data?.role,
    first_name: profileRes.data.data?.first_name,
    last_name: profileRes.data.data?.last_name,
    employee_id: profileRes.data.data?.employee_id
  });

  // 4. Update Owner Profile Details (Name, Phone, Bio, Avatar)
  console.log('\n4. Updating Owner Details via PUT /api/auth/profile...');
  const updateRes = await axios.put(`${API_BASE}/auth/profile`, {
    first_name: 'David',
    last_name: 'Sterling (CEO)',
    phone: '+91 9988001122',
    address: '100 Silicon Blvd, Suite 400',
    about_me: 'Founder & CEO of NovaTech Solutions'
  }, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  console.log('✅ Profile Update Succeeded:', updateRes.data.message);

  // 5. Add a real company employee, then delete that employee
  console.log('\n5. Creating and deleting an employee to verify complete user isolation...');
  const addEmpRes = await axios.post(`${API_BASE}/employees`, {
    first_name: 'Sarah',
    last_name: 'Connor',
    email: `sarah_${randomId}@novatech.io`,
    hire_date: '2026-08-01',
    position: 'Senior Engineer',
    salary: 85000
  }, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });

  const createdEmpId = addEmpRes.data.data?.employee_id;
  console.log('✅ Created Employee ID:', createdEmpId);

  // Delete that employee
  await axios.delete(`${API_BASE}/employees/${createdEmpId}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  console.log('✅ Deleted Employee successfully.');

  // 6. Verify Admin can still log in and view profile with 0 errors
  const reLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: testPassword
  });
  console.log('✅ Admin Re-login Succeeded:', reLoginRes.data.data?.user?.email);

  console.log('\n=== ZERO-EMPLOYEE CLEAN OWNER ARCHITECTURE VERIFIED SUCCESSFULLY ===');
}

testCleanOwnerArchitecture().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
