const { pool } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const resetData = async () => {
    const client = await pool.connect();
    try {
        console.log('⚠️  WARNING: THIS WILL DELETE ALL DATA EXCEPT ADMIN ACCOUNTS ⚠️');

        // 1. Get all tenants
        const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsRes.rows;

        console.log(`Found ${tenants.length} tenants: ${tenants.map(t => t.tenant_id).join(', ')}`);

        // Tables to truncate (order matters for FKs)
        const tables = [
            'audit_logs',
            'task_updates',
            'task_assignments',
            'tasks',
            'expense_items',
            'expense_claims',
            'leave_comp_off_requests',
            'leave_requests',
            'attendance',
            'payroll',
            'job_applications',
            'job_postings',
            'documents',
            'chat_messages',
            'assets',
            'key_results',
            'goals',
            'performance_reviews',
            'performance_cycles',
            'employees',
            'departments'
        ];

        for (const tenant of tenants) {
            console.log(`\nProcessing tenant: ${tenant.tenant_id}...`);
            await client.query(`SET search_path TO "${tenant.tenant_id}"`);

            // Disable triggers/constraints locally if needed, or just delete in order.
            // Deleting in order is safer.

            for (const table of tables) {
                try {
                    // Check if table exists first to avoid errors
                    const tableCheck = await client.query(`
                        SELECT EXISTS (
                           SELECT FROM information_schema.tables 
                           WHERE  table_schema = $1
                           AND    table_name   = $2
                        );
                    `, [tenant.tenant_id, table]);

                    if (tableCheck.rows[0].exists) {
                        await client.query(`DELETE FROM "${table}" CASCADE`);
                        console.log(`   ✓ Formatted table: ${table}`);
                    }
                } catch (err) {
                    console.error(`   ❌ Failed to clear ${table}:`, err.message);
                }
            }

            // Cleanup Users (keep admins)
            console.log('   Cleaning users table (preserving admins)...');
            try {
                const result = await client.query(`DELETE FROM users WHERE role != 'admin'`);
                console.log(`   ✓ Deleted ${result.rowCount} non-admin users`);
            } catch (err) {
                console.error('   ❌ Failed to clean users:', err.message);
            }
        }

        console.log('\n✅ All data reset successfully!');

    } catch (error) {
        console.error('❌ Reset failed:', error);
    } finally {
        client.release();
        pool.end();
        process.exit();
    }
};

// Confirm before running
if (process.argv.includes('--force')) {
    resetData();
} else {
    rl.question('Are you sure you want to delete ALL business data? (yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
            resetData();
        } else {
            console.log('Cancelled.');
            process.exit(0);
        }
        rl.close();
    });
}
