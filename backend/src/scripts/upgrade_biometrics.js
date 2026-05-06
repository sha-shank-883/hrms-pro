const { pool } = require('../config/database');

async function upgradeBiometrics() {
    console.log('🔄 Starting Biometric Table Migration...');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Ensure shared.biometric_devices exists
        console.log('📦 Checking shared.biometric_devices table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS shared.biometric_devices (
                id SERIAL PRIMARY KEY,
                tenant_id VARCHAR(50) REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
                serial_number VARCHAR(100) UNIQUE NOT NULL,
                brand VARCHAR(100),
                status VARCHAR(50) DEFAULT 'active',
                last_ping TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Add biometric_id to shared schema template (for any global users table if used)
        console.log('📦 Checking global schema tables...');
        await client.query(`ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(100);`);
        await client.query(`ALTER TABLE IF EXISTS attendance ADD COLUMN IF NOT EXISTS device_serial VARCHAR(100);`);
        await client.query(`ALTER TABLE IF EXISTS attendance ADD COLUMN IF NOT EXISTS punch_source VARCHAR(50);`);

        // 3. Iterate over ALL existing tenants and upgrade their specific schemas
        console.log('🔍 Finding all tenants...');
        const tenantsResult = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsResult.rows;

        for (const tenant of tenants) {
            const schema = tenant.tenant_id;
            console.log(`\n⚙️  Upgrading schema for tenant: ${schema}`);
            
            try {
                // Check if employees table exists in this schema
                const empCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = $1 AND table_name = 'employees'
                    );
                `, [schema]);

                if (empCheck.rows[0].exists) {
                    await client.query(`ALTER TABLE "${schema}".employees ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(100);`);
                    console.log(`   ✅ Added biometric_id to ${schema}.employees`);
                }

                // Check if attendance table exists in this schema
                const attCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = $1 AND table_name = 'attendance'
                    );
                `, [schema]);

                if (attCheck.rows[0].exists) {
                    await client.query(`ALTER TABLE "${schema}".attendance ADD COLUMN IF NOT EXISTS device_serial VARCHAR(100);`);
                    await client.query(`ALTER TABLE "${schema}".attendance ADD COLUMN IF NOT EXISTS punch_source VARCHAR(50);`);
                    console.log(`   ✅ Added device_serial and punch_source to ${schema}.attendance`);
                }
            } catch (err) {
                console.error(`   ❌ Failed to upgrade schema ${schema}:`, err.message);
            }
        }

        await client.query('COMMIT');
        console.log('\n🎉 Biometric Migration Completed Successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

upgradeBiometrics();
