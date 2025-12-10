const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

const createTestUser = async () => {
    try {
        const email = 'test.performance@company.com';
        const password = 'password123';
        const role = 'manager';

        // Set search path to tenant_default
        await query('SET search_path TO tenant_default, public');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Check if user exists
        const check = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('Test user already exists. Updating password and activation...');
            await query('UPDATE users SET password_hash = $1, is_active = true WHERE email = $2', [passwordHash, email]);
        } else {
            console.log('Creating new test user...');
            const res = await query(
                'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, true) RETURNING user_id',
                [email, passwordHash, role]
            );

            const userId = res.rows[0].user_id;
            await query(
                `INSERT INTO employees (user_id, first_name, last_name, email, department_id, position, status, hire_date)
         VALUES ($1, 'Test', 'Performance', $2, 1, 'Manager', 'active', CURRENT_DATE)`,
                [userId, email]
            );
        }

        console.log(`Test user ${email} ready with password ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
};

createTestUser();
