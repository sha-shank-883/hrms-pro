const { pool, query } = require('../config/database');

const listTenants = async () => {
    

    try {
        const res = await query('SELECT * FROM shared.tenants ORDER BY created_at DESC');

        if (res.rows.length === 0) {
            
        } else {
            console.table(res.rows.map(t => ({
                TenantID: t.tenant_id,
                Name: t.name,
                Status: t.status,
                Created: t.created_at
            })));

            
        }

    } catch (error) {
        console.error('❌ Failed to list tenants:', error);
    } finally {
        pool.end();
    }
};

listTenants();
