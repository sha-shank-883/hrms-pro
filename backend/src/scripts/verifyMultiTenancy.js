const { pool, query, tenantStorage } = require('../config/database');
const Tenant = require('../models/tenantModel');

const verifyIsolation = async () => {
    

    try {
        // 1. Create a Test Tenant
        const testTenantId = 'tenant_test_corp';
        

        // Insert into shared.tenants
        await query(`
      INSERT INTO shared.tenants (tenant_id, name, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (tenant_id) DO NOTHING
    `, [testTenantId, 'Test Corp']);

        // Create schema for test tenant
        const client = await pool.connect();
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${testTenantId}"`);

        // Apply schema (just the users table for testing)
        await client.query(`SET search_path TO "${testTenantId}"`);
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
        client.release();

        // 2. Insert Data into Default Tenant
        
        // We need to simulate the middleware context
        await tenantStorage.run('tenant_default', async () => {
            await query(`INSERT INTO users (email, password_hash) VALUES ('user@default.com', 'hash123') ON CONFLICT DO NOTHING`);
        });

        // 3. Insert Data into Test Tenant
        
        await tenantStorage.run(testTenantId, async () => {
            await query(`INSERT INTO users (email, password_hash) VALUES ('user@testcorp.com', 'hash456') ON CONFLICT DO NOTHING`);
        });

        // 4. Verify Isolation
        

        // Check Default Tenant sees only its user
        await tenantStorage.run('tenant_default', async () => {
            const res = await query('SELECT email FROM users');
            const emails = res.rows.map(r => r.email);
            

            if (emails.includes('user@testcorp.com')) {
                throw new Error('❌ FAIL: Default tenant sees Test tenant data!');
            }
            if (!emails.includes('user@default.com')) {
                throw new Error('❌ FAIL: Default tenant cannot see its own data!');
            }
        });

        // Check Test Tenant sees only its user
        await tenantStorage.run(testTenantId, async () => {
            const res = await query('SELECT email FROM users');
            const emails = res.rows.map(r => r.email);
            

            if (emails.includes('user@default.com')) {
                throw new Error('❌ FAIL: Test tenant sees Default tenant data!');
            }
            if (!emails.includes('user@testcorp.com')) {
                throw new Error('❌ FAIL: Test tenant cannot see its own data!');
            }
        });

        

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        pool.end();
    }
};

verifyIsolation();
