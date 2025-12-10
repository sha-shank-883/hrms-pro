const { pool, tenantStorage } = require('../config/database');

const createAssetsTable = async () => {
    const client = await pool.connect();
    try {
        // We need to run this for the specific tenant. 
        // For development, we might be using a default tenant or we need to know the tenant ID.
        // However, the schema-based multi-tenancy usually means we switch schemas.
        // Let's assume we are running this for 'tenant_test_corp' as per previous context, 
        // or we can try to run it for all schemas if we can list them.

        // For now, let's try to run it on the 'public' schema (if used) and 'tenant_test_corp'.

        const schemas = ['public', 'tenant_test_corp']; // Add other tenant schemas if known

        for (const schema of schemas) {
            console.log(`Applying to schema: ${schema}`);
            await client.query(`SET search_path TO ${schema}`);

            // Check if employees table exists
            const res = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = $1
            `, [schema]);

            console.log('Tables in schema:', res.rows.map(r => r.table_name));

            await client.query(`
                CREATE TABLE IF NOT EXISTS assets (
                    asset_id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    serial_number VARCHAR(255) UNIQUE,
                    status VARCHAR(50) DEFAULT 'Available',
                    assigned_to INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
                    purchase_date DATE,
                    cost DECIMAL(15, 2),
                    vendor VARCHAR(255),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log(`Assets table created in ${schema}`);
        }

    } catch (err) {
        console.error('Error creating assets table:', err);
    } finally {
        client.release();
        pool.end();
    }
};

createAssetsTable();
