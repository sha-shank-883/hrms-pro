const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
let token = '';
const TENANT_ID = 'tenant_default';

const login = async () => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'test.performance@company.com',
            password: 'password123'
        }, {
            headers: { 'X-Tenant-ID': TENANT_ID }
        });
        token = res.data.data.token; // Note: structure might be data.token or just token, checking authController response
        // authController says: data: { user: ..., token }
        
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

const testPerformance = async () => {
    await login();

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': TENANT_ID
        }
    };

    try {
        // 1. Create Cycle
        
        const cycleRes = await axios.post(`${API_URL}/performance/cycles`, {
            title: 'Test Cycle 2025',
            start_date: '2025-01-01',
            end_date: '2025-12-31'
        }, config);
        

        // 2. Create Goal
        
        const goalRes = await axios.post(`${API_URL}/performance/goals`, {
            title: 'Learn React Native',
            description: 'Build a mobile app',
            due_date: '2025-06-30'
        }, config);
        

        // 3. Get Goals
        
        const getGoalsRes = await axios.get(`${API_URL}/performance/goals`, config);
        

        // 4. Get Reviews
        
        const getReviewsRes = await axios.get(`${API_URL}/performance/reviews`, config);
        

        
    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
};

testPerformance();
