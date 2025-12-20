const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Live Preparation Migration...');

        const sqlPath = path.join(__dirname, '../config/migrations/01_prepare_live.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Reading SQL from: ${sqlPath}`);

        // Execute the entire script
        await client.query(sql);

        console.log('✅ Migration executed successfully!');
        console.log('The database is now prepared for the live environment.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
};

runMigration();
