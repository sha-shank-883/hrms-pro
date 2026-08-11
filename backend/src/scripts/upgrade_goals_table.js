const { pool } = require('../config/database');

const upgradeGoalsTable = async (schema = 'public') => {
    try {
        console.log(`Upgrading schema: ${schema}...`);

        // Add new columns to goals table
        await pool.query(`
            ALTER TABLE ${schema}.goals 
            ADD COLUMN IF NOT EXISTS category VARCHAR(50),
            ADD COLUMN IF NOT EXISTS priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            ADD COLUMN IF NOT EXISTS weightage INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        // Create key_results table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.key_results (
                kr_id SERIAL PRIMARY KEY,
                goal_id INTEGER REFERENCES ${schema}.goals(goal_id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                metric_type VARCHAR(20) DEFAULT 'percentage',
                target_value DECIMAL(10, 2) DEFAULT 100,
                current_value DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log(`  ${schema} done`);
    } catch (err) {
        console.error(`Error upgrading goals table in schema ${schema}:`, err);
    }
};

// Run for all tenant schemas
(async () => {
    const schemas = ['public', 'tenant_default'];
    const result = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant\\_%'");
    for (const row of result.rows) {
        if (!schemas.includes(row.schema_name)) schemas.push(row.schema_name);
    }
    for (const s of schemas) await upgradeGoalsTable(s);
    console.log('Done');
    process.exit(0);
})();
