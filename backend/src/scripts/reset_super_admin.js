const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const readline = require('readline');

/**
 * Super Admin Management CLI
 * Usage:
 *   node src/scripts/reset_super_admin.js [email] [newPassword] [--disable-2fa]
 *   Or run interactively:
 *   node src/scripts/reset_super_admin.js
 */

const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
    }));
};

async function main() {
    const nonFlags = process.argv.slice(2).filter(a => !a.startsWith('--'));
    const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
    
    let email = nonFlags[0] || null;
    let newPassword = nonFlags[1] || null;
    const shouldDisable2FA = flags.includes('--disable-2fa');
    const isInteractive = nonFlags.length < 2;

    console.log('==============================================');
    console.log('🔐 HRMS Pro — Super Admin Credential Manager');
    console.log('==============================================\n');

    try {
        // Ensure shared table exists
        await pool.query(`CREATE SCHEMA IF NOT EXISTS shared`);
        await pool.query(`
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

        // List existing Super Admins
        const listRes = await pool.query('SELECT id, email, full_name, is_2fa_enabled, is_active, last_login FROM shared.super_admins ORDER BY id');
        console.log('📋 Existing Super Admin Accounts:');
        if (listRes.rows.length === 0) {
            console.log('  (No Super Admin accounts found in database)');
        } else {
            listRes.rows.forEach(r => {
                console.log(`  - [ID: ${r.id}] ${r.email} (${r.full_name}) | 2FA: ${r.is_2fa_enabled ? 'ENABLED' : 'DISABLED'} | Active: ${r.is_active}`);
            });
        }
        console.log('');

        // Interactive prompts if args not provided
        if (!email) {
            email = await askQuestion('👉 Enter Super Admin Email (e.g. info@hrmspro.online): ');
        }

        if (!email || !email.includes('@')) {
            console.error('❌ Error: A valid email address is required.');
            process.exit(1);
        }

        if (!newPassword) {
            newPassword = await askQuestion('👉 Enter New Password (min 6 characters): ');
        }

        if (!newPassword || newPassword.length < 6) {
            console.error('❌ Error: Password must be at least 6 characters.');
            process.exit(1);
        }

        let disable2faChoice = shouldDisable2FA;
        if (isInteractive && !shouldDisable2FA) {
            const disableAns = await askQuestion('👉 Also disable/reset 2FA for this user? (y/n, default: n): ');
            disable2faChoice = disableAns.toLowerCase() === 'y' || disableAns.toLowerCase() === 'yes';
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Check if user exists
        const checkUser = await pool.query('SELECT id, email FROM shared.super_admins WHERE email = $1', [email]);

        if (checkUser.rows.length > 0) {
            if (disable2faChoice) {
                await pool.query(`
                    UPDATE shared.super_admins 
                    SET password_hash = $1, 
                        is_2fa_enabled = false, 
                        two_factor_secret = NULL,
                        is_active = true,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE email = $2
                `, [passwordHash, email]);
                console.log(`\n✅ SUCCESS: Password updated and 2FA DISABLED for Super Admin: ${email}`);
            } else {
                await pool.query(`
                    UPDATE shared.super_admins 
                    SET password_hash = $1, 
                        is_active = true,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE email = $2
                `, [passwordHash, email]);
                console.log(`\n✅ SUCCESS: Password updated for Super Admin: ${email}`);
            }
        } else {
            await pool.query(`
                INSERT INTO shared.super_admins (email, password_hash, full_name, is_2fa_enabled, is_active)
                VALUES ($1, $2, 'Super Admin', false, true)
            `, [email, passwordHash]);
            console.log(`\n✅ SUCCESS: Created new Super Admin account: ${email}`);
        }

        console.log('\n==============================================');
        console.log('🎉 You can now log in at: http://localhost:5173/login');
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${newPassword}`);
        console.log('==============================================\n');

    } catch (err) {
        console.error('\n❌ Database error:', err.message);
    } finally {
        await pool.end();
    }
}

main();
