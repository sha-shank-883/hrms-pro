const { pool, query, tenantStorage } = require('../config/database');

const inspectSchema = async () => {
    const tenantId = 'tenant_test_corp';
    console.log(`🔍 Inspecting schema for ${tenantId}...`);

    try {
        await tenantStorage.run(tenantId, async () => {
            // List all columns in the users table for this tenant
            const res = await query(`
        SELECT table_schema, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);

            console.log('Columns in users table:');
            console.table(res.rows);
        });

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        pool.end();
    }
};

inspectSchema();
