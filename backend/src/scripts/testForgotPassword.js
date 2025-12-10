const axios = require('axios');
const { pool } = require('../config/database');

const testForgotPasswordFlow = async () => {
    try {
        console.log('🧪 Testing Forgot Password Flow...');
        const email = 'admin@hrmspro.com';
        const newPassword = 'newpassword123';

        // 1. Request Password Reset
        console.log(`1. Requesting reset for ${email}...`);
        const forgotRes = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
        console.log('   Response:', forgotRes.data);

        if (!forgotRes.data.success) {
            throw new Error('Forgot password request failed');
        }

        // 2. Get Token from DB
        console.log('2. Retrieving token from database...');
        // Note: In multi-tenancy, we need to know which tenant. 
        // The admin user is in 'tenant_default' (or whatever tenant the user belongs to).
        // For this test, we assume the admin user we are testing is in 'tenant_default' or 'public' if not fully migrated.
        // But wait, the admin user was inserted into `users` table in `tenant_schema.sql`.
        // Let's assume we are testing against `tenant_default` for now.

        // We need to query the specific tenant schema.
        // Let's try to find where the user is.
        // Since we don't know the tenant easily here without context, let's try 'tenant_default'.

        const client = await pool.connect();
        let tokenHash;
        try {
            await client.query('SET search_path TO "tenant_default"');
            const userRes = await client.query('SELECT reset_token FROM users WHERE email = $1', [email]);

            if (userRes.rows.length === 0 || !userRes.rows[0].reset_token) {
                throw new Error('User not found or token not set in DB');
            }
            tokenHash = userRes.rows[0].reset_token;
            console.log('   Token Hash found in DB');
        } finally {
            client.release();
        }

        // 3. Reset Password
        // The API expects the raw token, but we stored the hash. 
        // Wait, the controller generates a token, hashes it, saves the hash, and sends the RAW token in email.
        // We can't get the raw token from DB. We only have the hash.
        // This means we cannot fully automate the "Reset" step unless we intercept the email or mock the randomBytes.

        // HOWEVER, for this test, we can verify that the token was set in the DB, which confirms the "Forgot" flow worked.
        // To test the "Reset" flow, we can manually set a known token hash in the DB and then try to reset it.

        console.log('3. Verifying Reset Flow with manual token...');
        const crypto = require('crypto');
        const testToken = 'test-token-123';
        const testTokenHash = crypto.createHash('sha256').update(testToken).digest('hex');
        const expiresIn = new Date(Date.now() + 30 * 60 * 1000);

        const client2 = await pool.connect();
        try {
            await client2.query('SET search_path TO "tenant_default"');
            await client2.query(
                'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
                [testTokenHash, expiresIn, email]
            );
        } finally {
            client2.release();
        }

        console.log('   Manual token set. Calling Reset API...');
        const resetRes = await axios.post(`http://localhost:5000/api/auth/reset-password/${testToken}`, {
            password: newPassword
        });
        console.log('   Response:', resetRes.data);

        if (!resetRes.data.success) {
            throw new Error('Reset password failed');
        }

        // 4. Verify Login with New Password
        console.log('4. Verifying Login with new password...');
        try {
            const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password: newPassword
            });
            if (loginRes.data.success) {
                console.log('✅ Login Successful with new password!');
            }
        } catch (err) {
            console.error('❌ Login failed:', err.response?.data || err.message);
            throw err;
        }

        console.log('✅ Forgot Password Flow Verified Successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) console.error('   API Error:', error.response.data);
    } finally {
        pool.end();
    }
};

testForgotPasswordFlow();
