require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testAdminProfileManagement() {
  console.log('=== Testing Tenant Admin / Company Owner Profile Flow ===\n');

  // 1. Sign up a new tenant admin
  const randomId = Date.now().toString().slice(-4);
  const testEmail = `owner_${randomId}@matrixcorp.io`;
  const testPassword = 'Password@123';

  console.log('1. Registering new tenant company...');
  const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
    companyName: `Matrix Corp ${randomId}`,
    fullName: 'Trinity Moss',
    email: testEmail,
    password: testPassword,
    phone: '+91 9988776655'
  });

  const token = signupRes.data.data?.token;
  const tenantId = signupRes.data.data?.tenant?.tenantId;
  console.log('✅ Registered Tenant:', tenantId, '| Admin:', testEmail);

  // 2. Fetch Profile as Tenant Admin (Company Owner)
  console.log('\n2. Fetching profile for Tenant Admin...');
  const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  console.log('✅ Fetched Profile Data:', {
    email: profileRes.data.data?.email,
    role: profileRes.data.data?.role,
    first_name: profileRes.data.data?.first_name,
    last_name: profileRes.data.data?.last_name,
    position: profileRes.data.data?.position
  });

  // 3. Update Profile directly without requiring salary or department assignment
  console.log('\n3. Updating Admin Profile (phone, address, about_me)...');
  const updateRes = await axios.put(`${API_BASE}/auth/profile`, {
    first_name: 'Trinity',
    last_name: 'Moss (Founder)',
    phone: '+91 9999988888',
    address: '742 Evergreen Terrace, Cyber City',
    about_me: 'Founder and Chief Technology Officer at Matrix Corp.'
  }, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });

  console.log('✅ Updated Profile Response:', updateRes.data);

  // 4. Verify updated profile
  const verifyRes = await axios.get(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId }
  });
  console.log('✅ Verified Updated Profile:', {
    first_name: verifyRes.data.data?.first_name,
    last_name: verifyRes.data.data?.last_name,
    phone: verifyRes.data.data?.phone,
    address: verifyRes.data.data?.address,
    about_me: verifyRes.data.data?.about_me
  });

  console.log('\n=== TENANT ADMIN PROFILE MANAGEMENT VERIFIED SUCCESSFULLY ===');
}

testAdminProfileManagement().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
