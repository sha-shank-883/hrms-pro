const { pool, query, tenantStorage } = require('../config/database');

const migrateTenants = async () => {
    console.log('🔄 Starting Migration: Adding missing columns...');

    const tenants = ['tenant_default', 'tenant_test_corp'];

    for (const tenantId of tenants) {
        console.log(`\nMigrating ${tenantId}...`);
        try {
            await tenantStorage.run(tenantId, async () => {

                // 1. Check and add is_active
                const checkActive = await query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name='users' AND column_name='is_active' AND table_schema=$1
        `, [tenantId]);
                if (checkActive.rows.length === 0) {
                    console.log('   Adding is_active column...');
                    await query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true`);
                } else {
                    console.log('   ✓ is_active exists');
                }

                // 2. Check and add role
                const checkRole = await query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name='users' AND column_name='role' AND table_schema=$1
        `, [tenantId]);
                if (checkRole.rows.length === 0) {
                    console.log('   Adding role column...');
                    await query(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'employee'`);
                } else {
                    console.log('   ✓ role exists');
                }

                // 3. Check and add created_at
                const checkCreated = await query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name='users' AND column_name='created_at' AND table_schema=$1
        `, [tenantId]);
                if (checkCreated.rows.length === 0) {
                    console.log('   Adding created_at column...');
                    await query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
                } else {
                    console.log('   ✓ created_at exists');
                }

                // 4. Check and add updated_at
                const checkUpdated = await query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name='users' AND column_name='updated_at' AND table_schema=$1
        `, [tenantId]);
                if (checkUpdated.rows.length === 0) {
                    console.log('   Adding updated_at column...');
                    await query(`ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
                } else {
                    console.log('   ✓ updated_at exists');
                }

            });
        } catch (error) {
            console.error(`   ❌ Migration failed for ${tenantId}:`, error.message);
        }
    }

    console.log('\n✨ Migration Completed!');
    pool.end();
};

migrateTenants();
