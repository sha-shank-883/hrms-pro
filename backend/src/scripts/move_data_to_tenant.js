const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

async function migrateData() {
    const client = await pool.connect();
    const tenantId = 'tenant_default';

    try {
        console.log(`Starting migration from PUBLIC to ${tenantId}...`);

        await client.query('BEGIN');

        // Tables to migrate in order of dependency
        // USERS must come first
        const tables = [
            'users',
            'departments',
            'employees',
            'attendance',
            'leave_requests',
            'tasks',
            'payroll',
            'job_postings'
        ];

        for (const table of tables) {
            console.log(`Migrating ${table}...`);

            // select from public
            const publicData = await client.query(`SELECT * FROM public.${table}`);

            if (publicData.rows.length > 0) {
                console.log(`  Found ${publicData.rows.length} rows in public.${table}`);

                const fields = publicData.fields.map(f => f.name);
                const columns = fields.join(', ');

                let inserted = 0;

                for (const row of publicData.rows) {
                    const values = fields.map((f, i) => `$${i + 1}`);
                    const valueArray = fields.map(f => row[f]);

                    const queryText = `
             INSERT INTO "${tenantId}".${table} (${columns})
             VALUES (${values.join(', ')})
             ON CONFLICT DO NOTHING
           `;

                    await client.query(queryText, valueArray);
                    inserted++;
                }
                console.log(`  Migrated ${inserted} rows to ${tenantId}.${table}`);
            } else {
                console.log(`  No data in public.${table}`);
            }
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrateData();
