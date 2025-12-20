const { pool } = require('../config/database');

const createAssetsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating assets table in tenant_default...');

        await client.query('SET search_path TO "tenant_default"');

        await client.query(`
            CREATE TABLE IF NOT EXISTS assets (
                asset_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                serial_number VARCHAR(255) UNIQUE,
                status VARCHAR(50) DEFAULT 'Available',
                assigned_to INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
                department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
                purchase_date DATE,
                cost DECIMAL(15, 2),
                vendor VARCHAR(255),
                notes TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Assets table created successfully in tenant_default');

    } catch (error) {
        console.error('❌ Failed create table:', error);
    } finally {
        client.release();
        pool.end();
    }
};

createAssetsTable();
