const { query } = require('../config/database');

(async () => {
    try {
        const r = await query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'goals'");
        console.log('Goals table schemas:', r.rows.map(r => r.table_schema).join(', '));
        
        const c = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'goals' AND table_schema = 'tenant_default' ORDER BY ordinal_position");
        console.log('tenant_default.goals columns:', c.rows.map(r => r.column_name).join(', '));
        
        // Check if employee exists in tenant_default schema
        const e = await query("SELECT employee_id FROM tenant_default.employees WHERE employee_id = 155");
        console.log('Employee 155 exists:', e.rows.length > 0);
        
        process.exit(0);
    } catch(e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
})();
