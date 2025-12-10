const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const debugLogin = async () => {
    console.log('🕵️‍♀️ Starting Login Debug...');

    const credentials = {
        email: 'user@testcorp.com',
        password: 'password123'
    };

    const tenantId = 'tenant_test_corp';

    console.log(`\nAttempting login for:`);
    console.log(`Tenant: ${tenantId}`);
    console.log(`Email: ${credentials.email}`);
    console.log(`Password: ${credentials.password}`);

    try {
        const res = await axios.post(`${API_URL}/auth/login`, credentials, {
            headers: { 'x-tenant-id': tenantId }
        });

        console.log('\n✅ Login Successful!');
        console.log('User:', res.data.data.user);
        console.log('Token:', res.data.data.token ? 'Generated' : 'Missing');

    } catch (error) {
        console.log('\n❌ Login Failed!');
        if (error.response) {
            console.log(`Status: ${error.response.status} ${error.response.statusText}`);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
};

debugLogin();
