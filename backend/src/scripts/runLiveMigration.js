const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        

        const sqlPath = path.join(__dirname, '../config/migrations/01_prepare_live.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        

        // Execute the entire script
        await client.query(sql);

        
        

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
};

runMigration();
