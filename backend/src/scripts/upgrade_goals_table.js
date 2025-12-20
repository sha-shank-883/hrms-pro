const { query } = require('../config/database');

const upgradeGoalsTable = async () => {
    try {
        // Add new columns to goals table
        await query(`
            ALTER TABLE goals 
            ADD COLUMN IF NOT EXISTS category VARCHAR(50),
            ADD COLUMN IF NOT EXISTS priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            ADD COLUMN IF NOT EXISTS weightage INTEGER DEFAULT 0
        `);
        console.log("Updated 'goals' table with new columns");

        // Create key_results table
        await query(`
            CREATE TABLE IF NOT EXISTS key_results (
                kr_id SERIAL PRIMARY KEY,
                goal_id INTEGER REFERENCES goals(goal_id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                metric_type VARCHAR(20) DEFAULT 'percentage', -- percentage, number, currency
                target_value DECIMAL(10, 2) DEFAULT 100,
                current_value DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created 'key_results' table");

    } catch (err) {
        console.error("Error upgrading goals implementation:", err);
    }
};

upgradeGoalsTable();
