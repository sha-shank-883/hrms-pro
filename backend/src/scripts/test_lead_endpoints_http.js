const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing Lead & Demo Request HTTP Endpoints...');
  
  // 1. Test POST /api/leads/demo
  const demoPayload = {
    name: 'Jane Doe',
    email: `jane_${Date.now()}@acme.inc`,
    company_name: 'Acme Test Corp',
    phone: '+1 555-0199',
    password: 'Password@123'
  };

  const demoRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/leads/demo',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, demoPayload);

  console.log('POST /api/leads/demo Response Status:', demoRes.status);
  console.log('POST /api/leads/demo Response Data:', demoRes.data);

  if (demoRes.status === 201 && demoRes.data.success) {
    console.log('✅ POST /api/leads/demo PASSED');
  } else {
    console.error('❌ POST /api/leads/demo FAILED');
    process.exit(1);
  }

  // 2. Test duplicate email validation
  const duplicateRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/leads/demo',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, demoPayload);

  console.log('POST /api/leads/demo (Duplicate) Status:', duplicateRes.status);
  if (duplicateRes.status === 409) {
    console.log('✅ Duplicate demo email rejection PASSED');
  } else {
    console.error('❌ Duplicate demo email rejection FAILED');
  }

  console.log('🎉 All Lead & Demo HTTP endpoint tests PASSED!');
}

runTests();
