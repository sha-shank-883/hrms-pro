const { pool } = require('../config/database');

const createPerformanceTables = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating performance management tables for all tenants...');

        // 1. Get all tenants
        const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsRes.rows;

        for (const tenant of tenants) {
            console.log(`Processing tenant: ${tenant.tenant_id}...`);
            try {
                await client.query(`SET search_path TO "${tenant.tenant_id}"`);

                // 1. Performance Cycles Table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS performance_cycles (
                        cycle_id SERIAL PRIMARY KEY,
                        title VARCHAR(100) NOT NULL,
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                // 2. Goals Table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS goals (
                        goal_id SERIAL PRIMARY KEY,
                        employee_id INTEGER REFERENCES employees(employee_id),
                        title VARCHAR(200) NOT NULL,
                        description TEXT,
                        status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
                        progress INTEGER DEFAULT 0, -- 0-100
                        due_date DATE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                // 3. Performance Reviews Table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS performance_reviews (
                        review_id SERIAL PRIMARY KEY,
                        employee_id INTEGER REFERENCES employees(employee_id),
                        reviewer_id INTEGER REFERENCES employees(employee_id), -- Usually the manager
                        cycle_id INTEGER REFERENCES performance_cycles(cycle_id),
                        status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, self_review_submitted, manager_review_submitted, completed
                        self_rating DECIMAL(3,1),
                        manager_rating DECIMAL(3,1),
                        final_rating DECIMAL(3,1),
                        self_comments TEXT,
                        manager_comments TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                
                console.log(`   ✓ Tables created for ${tenant.tenant_id}`);

            } catch (err) {
                console.error(`   ❌ Failed for ${tenant.tenant_id}:`, err.message);
            }
        }

        console.log('All performance tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        client.release();
        pool.end();
    }
};

createPerformanceTables();
