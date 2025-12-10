const axios = require('axios');

const API_URL = 'http://127.0.0.1:5001/api';

const runDemo = async () => {
    console.log('🚀 Starting HTTP Multi-Tenancy Demo...');
    console.log('Waiting for server to be ready...');

    // Simple delay to let server start
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // 1. Test Request WITHOUT Tenant ID
        console.log('\n1️⃣  Testing Request WITHOUT Tenant ID...');
        try {
            await axios.get(`${API_URL}/tenant-info`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Expected Error: ${error.response.status} ${error.response.statusText}`);
                console.log(`   Response: ${JSON.stringify(error.response.data)}`);
            } else {
                console.log('   ❌ Unexpected Error:', error.message);
            }
        }

        // 2. Test Request with DEFAULT Tenant
        console.log('\n2️⃣  Testing Request with DEFAULT Tenant (tenant_default)...');
        try {
            const res = await axios.get(`${API_URL}/tenant-info`, {
                headers: { 'x-tenant-id': 'tenant_default' }
            });
            console.log(`   ✅ Success: ${res.status} OK`);
            console.log(`   Tenant Info: ${JSON.stringify(res.data)}`);
        } catch (error) {
            console.log('   ❌ Request Failed:', error.message);
        }

        // 3. Test Request with TEST Tenant
        console.log('\n3️⃣  Testing Request with TEST Tenant (tenant_test_corp)...');
        try {
            const res = await axios.get(`${API_URL}/tenant-info`, {
                headers: { 'x-tenant-id': 'tenant_test_corp' }
            });
            console.log(`   ✅ Success: ${res.status} OK`);
            console.log(`   Tenant Info: ${JSON.stringify(res.data)}`);
        } catch (error) {
            console.log('   ❌ Request Failed:', error.message);
        }

        // 4. Test Request with INVALID Tenant
        console.log('\n4️⃣  Testing Request with INVALID Tenant...');
        try {
            await axios.get(`${API_URL}/tenant-info`, {
                headers: { 'x-tenant-id': 'invalid_tenant_id' }
            });
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ Expected Error: ${error.response.status} ${error.response.statusText}`);
                console.log(`   Response: ${JSON.stringify(error.response.data)}`);
            } else {
                console.log('   ❌ Unexpected Error:', error.message);
            }
        }

        console.log('\n✨ Demo Completed!');

    } catch (error) {
        console.error('Demo failed:', error);
    }
};

runDemo();
