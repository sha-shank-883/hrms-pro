const { pool } = require('../config/database');

const fixAndCheck = async () => {
    try {
        console.log('Running Migration...');
        await pool.query(`
            ALTER TABLE shared.tenants 
            ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free',
            ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP;
        `);
        console.log('✅ Migration Done.');

        const res = await pool.query('SELECT tenant_id, name, status, subscription_plan, subscription_expiry FROM shared.tenants');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
};

fixAndCheck();
