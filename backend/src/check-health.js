const axios = require('axios');

const checkHealth = async () => {
    try {
        const res = await axios.get('http://localhost:5000/health');
        console.log('Health check:', res.data);
    } catch (error) {
        console.error('Health check failed:', error.message);
        // Try port 5001 just in case
        try {
            const res2 = await axios.get('http://localhost:5001/health');
            console.log('Health check (5001):', res2.data);
        } catch (error2) {
            console.error('Health check (5001) failed:', error2.message);
        }
    }
};

checkHealth();
