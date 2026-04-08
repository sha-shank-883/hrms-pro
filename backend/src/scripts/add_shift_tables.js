const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const updateSchemas = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting shift tables migration...');

        // Get all tenant schemas
        const schemasRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
        `);

        const schemas = schemasRes.rows.map(r => r.schema_name);
        console.log(`📡 Found ${schemas.length} tenant schemas: ${schemas.join(', ')}`);

        for (const schema of schemas) {
            try {
                console.log(`📦 Updating schema: "${schema}"...`);

                // Check if employees table exists in this schema
                const tableCheck = await client.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = $1 AND table_name = 'employees'
                `, [schema]);

                if (tableCheck.rows.length === 0) {
                    console.log(`   ⏭️ Skipping "${schema}" (No employees table found).`);
                    continue;
                }

                // 1. Create Shifts table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS "${schema}".shifts (
                        shift_id SERIAL PRIMARY KEY,
                        shift_name VARCHAR(50) NOT NULL,
                        start_time TIME NOT NULL,
                        end_time TIME NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                console.log(`   ✅ Table "shifts" checked/created.`);

                // 2. Create Employee Shifts table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS "${schema}".employee_shifts (
                        assignment_id SERIAL PRIMARY KEY,
                        employee_id INTEGER REFERENCES "${schema}".employees(employee_id) ON DELETE CASCADE,
                        shift_id INTEGER REFERENCES "${schema}".shifts(shift_id) ON DELETE CASCADE,
                        start_date DATE NOT NULL,
                        end_date DATE,
                        assigned_by INTEGER REFERENCES "${schema}".users(user_id),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                console.log(`   ✅ Table "employee_shifts" checked/created.`);

                // 3. Update Attendance table with geofencing columns
                const geoCols = [
                    { name: 'check_in_latitude', type: 'DECIMAL(10, 8)' },
                    { name: 'check_in_longitude', type: 'DECIMAL(10, 8)' },
                    { name: 'check_out_latitude', type: 'DECIMAL(10, 8)' },
                    { name: 'check_out_longitude', type: 'DECIMAL(10, 8)' },
                    { name: 'location_status', type: 'VARCHAR(50)' }
                ];

                for (const col of geoCols) {
                    const colCheck = await client.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = $1 AND table_name = 'attendance' AND column_name = $2
                    `, [schema, col.name]);

                    if (colCheck.rows.length === 0) {
                        await client.query(`ALTER TABLE "${schema}".attendance ADD COLUMN ${col.name} ${col.type}`);
                        console.log(`   ➕ Added column "${col.name}" to attendance table.`);
                    }
                }
            } catch (err) {
                console.error(`   ❌ Failed to update schema "${schema}":`, err.message);
            }
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

updateSchemas();
