const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const setupMultiTenancy = async () => {
    const client = await pool.connect();
    try {
        

        // 1. Create Shared Schema
        
        const sharedSchemaSql = fs.readFileSync(path.join(__dirname, '../config/shared_schema.sql'), 'utf8');
        await client.query(sharedSchemaSql);
        

        // 2. Create Default Tenant (for migration)
        const defaultTenantId = 'tenant_default';
        

        // Insert into shared.tenants
        await client.query(`
          INSERT INTO shared.tenants (tenant_id, name, status)
          VALUES ($1, $2, 'active')
          ON CONFLICT (tenant_id) DO NOTHING
        `, [defaultTenantId, 'Default Company']);

        // 2.5 Migration: Ensure subscription columns exist (for existing live DBs)
        
        try {
            await client.query(`
                ALTER TABLE shared.tenants 
                ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free',
                ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP;
            `);
            
        } catch (migErr) {
            console.warn('⚠️ Migration warning:', migErr.message);
        }

        // 3. Create Schema for Default Tenant
        
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${defaultTenantId}"`);

        // 4. Run Tenant Schema SQL
        
        let tenantSchemaSql = fs.readFileSync(path.join(__dirname, '../config/tenant_schema.sql'), 'utf8');

        // Replace placeholder if we used one, but in Postgres we can just set search_path
        // But my tenant_schema.sql creates tables without schema prefix, so setting search_path is key.

        await client.query(`SET search_path TO "${defaultTenantId}"`);
        await client.query(tenantSchemaSql);

        

        // 5. Create Default Admin User
        
        await client.query(`
          INSERT INTO users (email, password_hash, role) 
          VALUES ('admin@hrmspro.com', '$2b$10$ZI0JCV5V.vT7b4sMK/FUA.xOFngGT9VQ64TK.ug4EvYwlda2FyTou', 'admin')
          ON CONFLICT (email) DO NOTHING
        `);
        

        // 5. (Optional) Migrate data from public to default tenant
        // This is complex and depends on if 'public' has data. 
        // For now, we assume we are setting up fresh or user will manually migrate.
        // But to be safe, let's warn.
        

        
    } catch (error) {
        console.error('❌ Error setting up multi-tenancy:', error);
    } finally {
        client.release();
        pool.end();
    }
};

setupMultiTenancy();
