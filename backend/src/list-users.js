const { query } = require('./config/database');

const listUsers = async () => {
    try {
        const res = await query('SELECT email, role FROM users LIMIT 10');
        console.log('Users:', res.rows);
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
};

listUsers();
