const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// --- Helper Data & Functions ---

const departmentsList = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];
const positionsList = ['Developer', 'Manager', 'Analyst', 'Director', 'Intern'];
const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona', 'George', 'Hannah'];
const lastNames = ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateDemoData = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting Demo Data Generation...');

        // 1. Get all tenants
        const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
        const tenants = tenantsRes.rows;

        for (const tenant of tenants) {
            console.log(`\n📂 Processing Tenant: ${tenant.tenant_id}`);

            // Switch to tenant schema
            await client.query(`SET search_path TO "${tenant.tenant_id}"`);

            // Start Transaction for this tenant
            await client.query('BEGIN');

            try {
                // --- 1. Departments ---
                console.log('   Creating Departments...');
                const deptIds = [];
                for (const deptName of departmentsList) {
                    const res = await client.query(
                        `INSERT INTO departments (department_name, description, budget, location) 
                         VALUES ($1, $2, $3, $4) RETURNING department_id`,
                        [deptName, `${deptName} Department`, getRandomInt(10000, 500000), 'Headquarters']
                    );
                    deptIds.push(res.rows[0].department_id);
                }

                // --- 2. Users & Employees ---
                console.log('   Creating Users & Employees...');
                const employeeIds = [];
                const userIds = [];
                // Get Admin ID first to avoid FK issues if needed, or just use created users
                const adminRes = await client.query(`SELECT user_id FROM users WHERE role = 'admin' LIMIT 1`);
                const adminId = adminRes.rows[0]?.user_id;
                userIds.push(adminId); // Add admin to potential users list

                const hashedPassword = await bcrypt.hash('password123', 10);

                for (let i = 0; i < 10; i++) {
                    const email = `user${i}_${Date.now()}@${tenant.tenant_id}.com`; // Unique email

                    // Create User
                    const userRes = await client.query(
                        `INSERT INTO users (email, password_hash, role, is_active) 
                         VALUES ($1, $2, 'employee', true) RETURNING user_id`,
                        [email, hashedPassword]
                    );
                    const userId = userRes.rows[0].user_id;
                    userIds.push(userId);

                    // Create Employee
                    const deptId = getRandomItem(deptIds);
                    const empRes = await client.query(
                        `INSERT INTO employees (user_id, first_name, last_name, email, department_id, position, hire_date, salary, status)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') RETURNING employee_id`,
                        [
                            userId,
                            getRandomItem(firstNames),
                            getRandomItem(lastNames),
                            email,
                            deptId,
                            getRandomItem(positionsList),
                            getRandomDate(new Date(2020, 0, 1), new Date()),
                            getRandomInt(40000, 120000)
                        ]
                    );
                    employeeIds.push(empRes.rows[0].employee_id);
                }

                // --- 3. Attendance ---
                console.log('   Creating Attendance Records...');
                for (const empId of employeeIds) {
                    for (let i = 0; i < 10; i++) {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        await client.query(
                            `INSERT INTO attendance (employee_id, date, clock_in, clock_out, status, work_hours)
                             VALUES ($1, $2, '09:00:00', '17:00:00', 'present', 8)
                             ON CONFLICT (employee_id, date) DO NOTHING`,
                            [empId, date]
                        );
                    }
                }

                // --- 4. Leave Requests ---
                console.log('   Creating Leave Requests...');
                for (let i = 0; i < 10; i++) {
                    const empId = getRandomItem(employeeIds);
                    const startDate = getRandomDate(new Date(), new Date(2025, 11, 31));
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 2);

                    await client.query(
                        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason, status)
                         VALUES ($1, 'Sick Leave', $2, $3, 3, 'Not feeling well', 'pending')`,
                        [empId, startDate, endDate]
                    );
                }

                // --- 5. Tasks ---
                console.log('   Creating Tasks...');
                const taskIds = [];
                for (let i = 0; i < 10; i++) {
                    const res = await client.query(
                        `INSERT INTO tasks (title, description, priority, status, due_date, created_by, department_id)
                         VALUES ($1, $2, 'medium', 'todo', $3, $4, $5) RETURNING task_id`,
                        [
                            `Task ${i}`,
                            'Demo task description',
                            getRandomDate(new Date(), new Date(2025, 11, 31)),
                            adminId,
                            getRandomItem(deptIds)
                        ]
                    );
                    taskIds.push(res.rows[0].task_id);
                }

                // --- 6. Task Assignments ---
                console.log('   Creating Task Assignments...');
                for (const taskId of taskIds) {
                    const empId = getRandomItem(employeeIds);
                    await client.query(
                        `INSERT INTO task_assignments (task_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [taskId, empId]
                    );
                }

                // --- 7. Payroll ---
                console.log('   Creating Payroll Records...');
                const month = new Date().getMonth() + 1;
                const year = new Date().getFullYear();
                for (const empId of employeeIds) {
                    await client.query(
                        `INSERT INTO payroll (employee_id, month, year, basic_salary, net_salary, payment_status)
                          VALUES ($1, $2, $3, 5000, 4500, 'processed')
                          ON CONFLICT DO NOTHING`,
                        [empId, month, year]
                    );
                }

                // --- 8. Job Postings ---
                console.log('   Creating Job Postings...');
                const jobIds = [];
                for (let i = 0; i < 5; i++) {
                    const res = await client.query(
                        `INSERT INTO job_postings (title, description, department_id, posted_by, status)
                          VALUES ($1, ' Job Description', $2, $3, 'open') RETURNING job_id`,
                        [`Senior ${getRandomItem(positionsList)}`, getRandomItem(deptIds), adminId]
                    );
                    jobIds.push(res.rows[0].job_id);
                }

                // --- 9. Job Applications ---
                console.log('   Creating Job Applications...');
                for (const jobId of jobIds) {
                    await client.query(
                        `INSERT INTO job_applications (job_id, applicant_name, email, status)
                          VALUES ($1, 'Applicant Name', 'applicant@demo.com', 'submitted')`,
                        [jobId]
                    );
                    await client.query(
                        `INSERT INTO job_applications (job_id, applicant_name, email, status)
                         VALUES ($1, 'Applicant Name 2', 'applicant2@demo.com', 'submitted')`,
                        [jobId]
                    );
                }

                // --- 10. Documents ---
                console.log('   Creating Documents...');
                for (let i = 0; i < 10; i++) {
                    await client.query(
                        `INSERT INTO documents (employee_id, document_type, document_name, file_url, uploaded_by)
                         VALUES ($1, 'Contract', 'Employment Contract', 'http://example.com/doc.pdf', $2)`,
                        [getRandomItem(employeeIds), adminId]
                    );
                }

                // --- 11. Assets ---
                console.log('   Creating Assets...');
                for (let i = 0; i < 10; i++) {
                    await client.query(
                        `INSERT INTO assets (name, type, serial_number, status, assigned_to)
                         VALUES ($1, 'Hardware', $2, 'Assigned', $3)`,
                        [`Laptop ${i}`, `SN-${Date.now()}-${i}`, getRandomItem(employeeIds)]
                    );
                }

                await client.query('COMMIT');
                console.log(`   ✅ Tenant ${tenant.tenant_id} populated successfully!`);

            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`   ❌ Failed to populate tenant ${tenant.tenant_id}:`, err);
            }
        }

        console.log('\n🎉 Demo Data Generation Complete!');

    } catch (error) {
        console.error('❌ Script failed:', error);
    } finally {
        client.release();
        pool.end();
    }
};

generateDemoData();
