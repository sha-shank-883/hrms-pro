const axios = require('axios');

async function testRazorpayWithLogin() {
  console.log('--- Testing Razorpay with Real Login ---');
  
  try {
    // 1. Log in as tenant admin
    console.log('1. Logging in as tenant admin (admin@hrmspro.com)...');
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@hrmspro.com',
      password: 'Hrmspro@123'
    }, {
      headers: {
        'x-tenant-id': 'tenant_default'
      }
    });

    const token = loginRes.data.data.token;
    console.log('✅ Logged in. Token received:', token.slice(0, 20) + '...');

    // 2. Call Razorpay key endpoint
    console.log('\n2. Calling GET /api/payments/razorpay/key...');
    const keyRes = await axios.get('http://localhost:5001/api/payments/razorpay/key', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': 'tenant_default'
      }
    });
    console.log('Key response:', keyRes.data);

    // 3. Call Razorpay create-order endpoint
    console.log('\n3. Calling POST /api/payments/razorpay/create-order...');
    const orderRes = await axios.post('http://localhost:5001/api/payments/razorpay/create-order', {
      planId: 'scale',
      seats: 15
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': 'tenant_default'
      }
    });
    console.log('✅ Order created:', orderRes.data);

  } catch (err) {
    console.error('❌ Error occurred:');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
  }
}

testRazorpayWithLogin();
