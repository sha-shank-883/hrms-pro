const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const debugLogin = async () => {
    

    const credentials = {
        email: 'user@testcorp.com',
        password: 'password123'
    };

    const tenantId = 'tenant_test_corp';

    
    
    
    

    try {
        const res = await axios.post(`${API_URL}/auth/login`, credentials, {
            headers: { 'x-tenant-id': tenantId }
        });

        
        
        

    } catch (error) {
        
        if (error.response) {
            
            
        } else {
            
        }
    }
};

debugLogin();
