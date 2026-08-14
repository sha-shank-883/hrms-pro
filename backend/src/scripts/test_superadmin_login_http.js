const axios = require('axios');

async function testHttpLogin() {
  const accounts = [
    { email: 'info@hrmspro.online', password: 'Hrmspro@123' },
    { email: 'admin@hrmspro.com', password: 'Hrmspro@123' }
  ];

  for (const acc of accounts) {
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', acc);
      console.log(`[PASS] Login for ${acc.email}:`);
      console.log(`       Success: ${res.data.success}, Role: ${res.data.data?.user?.role}, isSuperAdmin: ${res.data.data?.user?.isSuperAdmin}`);
    } catch (err) {
      console.error(`[FAIL] Login for ${acc.email}:`, err.response?.data || err.message);
    }
  }
}

testHttpLogin();
