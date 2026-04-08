const { query, tenantStorage } = require('./config/database');

const listTenantUsers = async () => {
    const tenantId = 'tenant_default';
    
    
    try {
        await tenantStorage.run(tenantId, async () => {
            const res = await query('SELECT email, role FROM users LIMIT 10');
            
        });
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
};

listTenantUsers();
