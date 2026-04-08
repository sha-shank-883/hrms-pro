const { pool, query } = require('../config/database');

const removeDefault = async () => {
    const tenantId = 'default';
    

    try {
        // 1. Delete from shared.tenants
        const res = await query('DELETE FROM shared.tenants WHERE tenant_id = $1 RETURNING *', [tenantId]);

        if (res.rowCount > 0) {
            
        } else {
            
        }

        // 2. Drop Schema
        const client = await pool.connect();
        try {
            await client.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);
            
        } finally {
            client.release();
        }

        

    } catch (error) {
        console.error('❌ Failed to remove tenant:', error);
    } finally {
        pool.end();
    }
};

removeDefault();
