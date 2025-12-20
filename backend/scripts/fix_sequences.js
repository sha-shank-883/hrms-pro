const { Pool } = require('pg');
require('dotenv').config(); // Load env from current directory

console.log('Starting sequence fix script...');

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hrms_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(poolConfig);

async function fixSequences() {
    const client = await pool.connect();
    try {
        console.log('Connected to database.');

        // 1. Get all tenants or schemas
        // We'll try to get schemas that look like tenants or just use the shared.tenants table
        // For safety, let's look for all schemas that have an 'attendance' table
        const schemasRes = await client.query(`
      SELECT table_schema 
      FROM information_schema.tables 
      WHERE table_name = 'attendance'
    `);

        const schemas = schemasRes.rows.map(r => r.table_schema);
        console.log(`Found 'attendance' table in schemas: ${schemas.join(', ')}`);

        for (const schema of schemas) {
            console.log(`\n--- Processing schema: ${schema} ---`);

            // Set search path
            await client.query(`SET search_path TO "${schema}", public`);

            // Fix attendance sequence
            // Check if table exists (it should) and get max id
            const maxIdRes = await client.query('SELECT MAX(attendance_id) as max_id FROM attendance');
            const maxId = maxIdRes.rows[0].max_id || 0;
            const nextId = parseInt(maxId) + 1;

            console.log(`Max attendance_id in ${schema}: ${maxId}. Setting sequence to ${nextId}...`);

            // Get sequence name - assuming standard naming or looking it up
            // Dynamic lookup of sequence name associated with the column
            const seqNameRes = await client.query(`
        SELECT pg_get_serial_sequence('attendance', 'attendance_id') as seq_name
      `);

            const seqName = seqNameRes.rows[0].seq_name;

            if (seqName) {
                await client.query(`SELECT setval('${seqName}', ${nextId}, false)`);
                console.log(`Successfully updated sequence ${seqName} to ${nextId}`);
            } else {
                console.log('No sequence found for attendance_id column. It might not be SERIAL.');
            }

            // Also fix other tables just in case (Employees, Leaves, Tasks, etc)
            const tables = ['employees', 'leave_requests', 'tasks', 'payroll', 'departments'];

            for (const table of tables) {
                // Check if table exists in this schema
                const tableCheck = await client.query(`
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = $2
        `, [schema, table]);

                if (tableCheck.rowCount === 0) continue;

                const pkCol = table === 'leave_requests' ? 'leave_id' : `${table.slice(0, -1)}_id`; // naive plural to singular id guess

                // Correct PK mapping
                let actualPk = pkCol;
                if (table === 'leave_requests') actualPk = 'leave_id';
                else if (table === 'employees') actualPk = 'employee_id';
                else if (table === 'tasks') actualPk = 'task_id';
                else if (table === 'payroll') actualPk = 'payroll_id'; // schema says payroll_id
                else if (table === 'departments') actualPk = 'department_id';

                try {
                    const seqCheck = await client.query(`SELECT pg_get_serial_sequence('${table}', '${actualPk}') as seq`);
                    const seq = seqCheck.rows[0].seq;
                    if (seq) {
                        const max = await client.query(`SELECT MAX(${actualPk}) as m FROM ${table}`);
                        const next = (parseInt(max.rows[0].m) || 0) + 1;
                        await client.query(`SELECT setval('${seq}', ${next}, false)`);
                        console.log(`Fixed ${table} (${actualPk}) sequence -> ${next}`);
                    }
                } catch (e) {
                    // Ignore errors for other tables, focus is attendance
                    // console.log(`Skipped ${table}: ${e.message}`);
                }
            }
        }

        console.log('\nAll sequences updated successfully.');

    } catch (err) {
        console.error('Error running script:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixSequences();
