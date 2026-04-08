const { pool, query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createTenant = async () => {
    try {
        
        

        // 1. Gather Input
        let tenantId = await question('Enter Tenant ID (e.g., tenant_demo): ');
        while (!tenantId.startsWith('tenant_')) {
            
            tenantId = await question('Enter Tenant ID (e.g., tenant_demo): ');
        }

        const tenantName = await question('Enter Tenant Name (e.g., Demo Corp): ');
        const adminEmail = await question('Enter Admin Email: ');
        const adminPassword = await question('Enter Admin Password: ');

        rl.close();

        const tenantConfig = {
            id: tenantId,
            name: tenantName,
            adminEmail: adminEmail,
            adminPassword: adminPassword
        };

        

        // 2. Register in shared.tenants
        await query(`
      INSERT INTO shared.tenants (tenant_id, name, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (tenant_id) DO UPDATE SET name = $2
    `, [tenantConfig.id, tenantConfig.name]);
        

        // 3. Create Schema
        const client = await pool.connect();
        try {
            await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantConfig.id}"`);
            

            // 4. Run Tenant Schema SQL
            const schemaPath = path.join(__dirname, '../config/tenant_schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');

            await client.query(`SET search_path TO "${tenantConfig.id}"`);
            await client.query(schemaSql);
            

            // 5. Create Admin User
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tenantConfig.adminPassword, salt);

            await client.query(`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES ($1, $2, 'admin', true)
        ON CONFLICT (email) DO NOTHING
      `, [tenantConfig.adminEmail, hashedPassword]);

            

        } finally {
            client.release();
        }

        
        
        
        
        
        

    } catch (error) {
        console.error('\n❌ Failed to create tenant:', error);
        rl.close();
    } finally {
        pool.end();
        process.exit(0);
    }
};

createTenant();
