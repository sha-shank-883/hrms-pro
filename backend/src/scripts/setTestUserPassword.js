const bcrypt = require('bcryptjs');
const { pool, query, tenantStorage } = require('../config/database');

const setPassword = async () => {
    const tenantId = 'tenant_test_corp';
    const email = 'user@testcorp.com';
    const newPassword = 'password123';

    

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password in the specific tenant schema
        await tenantStorage.run(tenantId, async () => {
            const result = await query(
                `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING user_id`,
                [hashedPassword, email]
            );

            if (result.rowCount > 0) {
                
                
                
            } else {
                
            }
        });

    } catch (error) {
        console.error('❌ Failed to set password:', error);
    } finally {
        pool.end();
    }
};

setPassword();
