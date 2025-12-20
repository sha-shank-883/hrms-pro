const { pool } = require('../config/database');

const checkUser = async () => {
    const email = process.argv[2];
    if (!email) {
        console.log('Please provide an email');
        process.exit(1);
    }

    const client = await pool.connect();
    try {
        // Check in tenant_default
        await client.query('SET search_path TO "tenant_default"');
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log(`✅ User found in tenant_default: ID ${res.rows[0].user_id}, Role: ${res.rows[0].role}`);
        } else {
            console.log('❌ User NOT found in tenant_default');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        pool.end();
    }
};

checkUser();
