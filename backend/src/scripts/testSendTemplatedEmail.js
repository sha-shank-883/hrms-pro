/**
 * Test script to demonstrate sending a templated email via the API
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001';
const ADMIN_EMAIL = 'admin@hrmspro.com';
const ADMIN_PASSWORD = 'admin123';

const testSendTemplatedEmail = async () => {
    
    
    
    try {
        // 1. Login to get auth token
        
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        }, {
            headers: {
                'X-Tenant-ID': 'tenant_default'
            }
        });
        
        
        const token = loginResponse.data.data.token;
        
        
        
        // 2. Get available templates
        
        const templatesResponse = await axios.get(`${BASE_URL}/api/email-templates`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': 'tenant_default'
            }
        });
        
        
        templatesResponse.data.data.forEach((template, index) => {
            
        });
        
        // 3. Send a welcome email using template
        
        const sendResponse = await axios.post(`${BASE_URL}/api/email-templates/send`, {
            template_name: 'welcome_employee',
            to: 'test.employee@example.com',
            variables: {
                company_name: 'Tech Innovations Inc.',
                first_name: 'Alex',
                email: 'alex.johnson@example.com',
                position: 'Senior Developer',
                department: 'Engineering',
                start_date: '2025-03-01',
                temp_password: 'Welcome2025!'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': 'tenant_default'
            }
        });
        
        
        
        
        
        
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Network Error:', error.message);
        }
        process.exit(1);
    }
};

testSendTemplatedEmail();