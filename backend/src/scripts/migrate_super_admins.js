const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const migrateSuperAdmins = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting Global Super Admin Migration...');

        // 1. Ensure shared schema exists
        await client.query(`CREATE SCHEMA IF NOT EXISTS shared`);

        // 2. Create shared.super_admins table
        await client.query(`
            CREATE TABLE IF NOT EXISTS shared.super_admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) DEFAULT 'Super Admin',
                two_factor_secret VARCHAR(255),
                is_2fa_enabled BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ shared.super_admins table verified.');

        // 3. Check if super admins exist in tenant_default.users to copy their 2FA / password
        const defaultAdmins = [
            { email: 'info@hrmspro.online', name: 'Master Super Admin' },
            { email: 'admin@hrmspro.com', name: 'System Super Admin' }
        ];

        // Default hash for Hrmspro@123 if not found
        const defaultHash = '$2b$10$KSjIGnBOJwk/rkxlsg8WnewdeMQWjHerRJYTOWzIac7UY0DDzQ5Le';

        for (const admin of defaultAdmins) {
            let passwordHash = defaultHash;
            let twoFactorSecret = null;
            let is2faEnabled = false;

            try {
                const existingInTenant = await client.query(
                    `SELECT password_hash, two_factor_secret, is_two_factor_enabled FROM "tenant_default".users WHERE email = $1`,
                    [admin.email]
                );
                if (existingInTenant.rows.length > 0) {
                    passwordHash = existingInTenant.rows[0].password_hash || defaultHash;
                    twoFactorSecret = existingInTenant.rows[0].two_factor_secret || null;
                    is2faEnabled = !!existingInTenant.rows[0].is_two_factor_enabled;
                }
            } catch (e) {
                // tenant_default might not exist or users table might differ, continue gracefully
            }

            await client.query(`
                INSERT INTO shared.super_admins (email, password_hash, full_name, two_factor_secret, is_2fa_enabled, is_active)
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT (email) DO UPDATE
                SET password_hash = EXCLUDED.password_hash,
                    full_name = EXCLUDED.full_name,
                    is_active = true,
                    updated_at = CURRENT_TIMESTAMP;
            `, [admin.email, passwordHash, admin.name, twoFactorSecret, is2faEnabled]);

            console.log(`✅ Super Admin synced: ${admin.email}`);
        }

        console.log('🎉 Global Super Admin Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        throw err;
    } finally {
        client.release();
    }
};

if (require.main === module) {
    migrateSuperAdmins()
        .then(() => pool.end())
        .catch(() => process.exit(1));
}

module.exports = migrateSuperAdmins;
