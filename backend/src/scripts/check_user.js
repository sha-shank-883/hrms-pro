const { pool } = require('../config/database');

const checkUser = async () => {
    const email = process.argv[2];
    if (!email) {
        
        process.exit(1);
    }

    const client = await pool.connect();
    try {
        // Check in tenant_default
        await client.query('SET search_path TO "tenant_default"');
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            
        } else {
            
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        pool.end();
    }
};

checkUser();
