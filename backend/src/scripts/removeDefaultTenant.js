const { pool, query } = require('../config/database');

const removeDefault = async () => {
    const tenantId = 'default';
    console.log(`🗑️  Removing tenant: ${tenantId}...`);

    try {
        // 1. Delete from shared.tenants
        const res = await query('DELETE FROM shared.tenants WHERE tenant_id = $1 RETURNING *', [tenantId]);

        if (res.rowCount > 0) {
            console.log('   ✓ Removed from shared.tenants');
        } else {
            console.log('   ℹ️  Tenant record not found in shared.tenants');
        }

        // 2. Drop Schema
        const client = await pool.connect();
        try {
            await client.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);
            console.log('   ✓ Schema dropped (if existed)');
        } finally {
            client.release();
        }

        console.log('\n✅ Cleanup Successful!');

    } catch (error) {
        console.error('❌ Failed to remove tenant:', error);
    } finally {
        pool.end();
    }
};

removeDefault();
