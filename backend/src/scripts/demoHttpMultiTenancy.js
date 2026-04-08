const axios = require('axios');

const API_URL = 'http://127.0.0.1:5001/api';

const runDemo = async () => {
    
    

    // Simple delay to let server start
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // 1. Test Request WITHOUT Tenant ID
        
        try {
            await axios.get(`${API_URL}/tenant-info`);
        } catch (error) {
            if (error.response) {
                
                
            } else {
                
            }
        }

        // 2. Test Request with DEFAULT Tenant
        
        try {
            const res = await axios.get(`${API_URL}/tenant-info`, {
                headers: { 'x-tenant-id': 'tenant_default' }
            });
            
            
        } catch (error) {
            
        }

        // 3. Test Request with TEST Tenant
        
        try {
            const res = await axios.get(`${API_URL}/tenant-info`, {
                headers: { 'x-tenant-id': 'tenant_test_corp' }
            });
            
            
        } catch (error) {
            
        }

        // 4. Test Request with INVALID Tenant
        
        try {
            await axios.get(`${API_URL}/tenant-info`, {
                headers: { 'x-tenant-id': 'invalid_tenant_id' }
            });
        } catch (error) {
            if (error.response) {
                
                
            } else {
                
            }
        }

        

    } catch (error) {
        console.error('Demo failed:', error);
    }
};

runDemo();
