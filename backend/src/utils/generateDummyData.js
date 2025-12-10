const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hrms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'YourNewPassword123'
});

// Sample data arrays
const departments = [
  'Human Resources', 'Engineering', 'Marketing', 'Sales', 'Finance', 
  'Operations', 'Customer Service', 'IT Support', 'Research & Development',
  'Quality Assurance', 'Legal', 'Procurement', 'Facilities', 'Security',
  'Training & Development', 'Public Relations', 'Business Development',
  'Product Management', 'Design', 'Analytics', 'Compliance', 'Risk Management',
  'Corporate Strategy', 'Investor Relations', 'Executive Management'
];

const positions = [
  'Manager', 'Senior Developer', 'Junior Developer', 'Team Lead', 'Director',
  'Analyst', 'Specialist', 'Coordinator', 'Assistant', 'Supervisor',
  'Consultant', 'Administrator', 'Officer', 'Representative', 'Executive',
  'Associate', 'Head', 'Chief', 'VP', 'President'
];

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph',
  'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy',
  'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
  'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon',
  'Joshua', 'Michelle', 'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly',
  'George', 'Deborah', 'Timothy', 'Dorothy', 'Ronald', 'Lisa', 'Jason', 'Nancy',
  'Edward', 'Karen', 'Jeffrey', 'Betty', 'Ryan', 'Helen', 'Jacob', 'Sandra',
  'Gary', 'Donna', 'Nicholas', 'Carol', 'Eric', 'Ruth', 'Jonathan', 'Sharon',
  'Stephen', 'Michelle', 'Larry', 'Laura', 'Justin', 'Scott', 'Brandon', 'Benjamin',
  'Samuel', 'Frank', 'Gregory', 'Raymond', 'Patrick', 'Alexander', 'Jack', 'Dennis',
  'Jerry', 'Tyler', 'Aaron', 'Jose', 'Henry', 'Adam', 'Douglas', 'Nathan',
  'Peter', 'Zachary', 'Kyle', 'Walter', 'Harold', 'Jeremy', 'Ethan', 'Carl',
  'Keith', 'Roger', 'Gerald', 'Christian', 'Terry', 'Sean', 'Arthur', 'Austin',
  'Noah', 'Lawrence', 'Jesse', 'Joe', 'Bryan', 'Billy', 'Jordan', 'Albert',
  'Dylan', 'Bruce', 'Willie', 'Gabriel', 'Alan', 'Juan', 'Louis', 'Roy',
  'Ralph', 'Randy', 'Eugene', 'Vincent', 'Russell', 'Elijah', 'Carlton', 'Bradley'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson',
  'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz',
  'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long',
  'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan',
  'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Vasquez',
  'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds'
];

const leaveTypes = [
  'Sick Leave', 'Casual Leave', 'Vacation', 'Maternity Leave', 
  'Paternity Leave', 'Bereavement Leave', 'Unpaid Leave'
];

const documentTypes = [
  'Resume', 'Contract', 'ID Proof', 'Passport', 'Visa', 'Insurance', 
  'Certificate', 'License', 'Agreement', 'Policy'
];

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const getRandomFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * days));
  return date;
};

const generateDummyData = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database');

    // Start transaction
    await client.query('BEGIN');

    // 1. Create departments
    console.log('Creating departments...');
    const departmentIds = [];
    for (let i = 0; i < departments.length; i++) {
      // Check if department already exists
      const existingDept = await client.query(
        'SELECT department_id FROM departments WHERE department_name = $1',
        [departments[i]]
      );
      
      if (existingDept.rows.length === 0) {
        const result = await client.query(
          'INSERT INTO departments (department_name, description, budget, location) VALUES ($1, $2, $3, $4) RETURNING department_id',
          [departments[i], `Department of ${departments[i]}`, Math.floor(Math.random() * 1000000) + 50000, `Building ${String.fromCharCode(65 + i)}`]
        );
        departmentIds.push(result.rows[0].department_id);
      } else {
        departmentIds.push(existingDept.rows[0].department_id);
      }
    }
    console.log(`Created/Found ${departmentIds.length} departments`);

    // 2. Check if admin user exists, if not create it
    console.log('Checking/Creating admin user...');
    const adminResult = await client.query(
      'SELECT user_id FROM users WHERE email = $1',
      ['admin@hrmspro.com']
    );
    
    let adminUserId;
    if (adminResult.rows.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await client.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id',
        ['admin@hrmspro.com', adminPassword, 'admin']
      );
      adminUserId = newAdmin.rows[0].user_id;
      console.log('Created new admin user');
    } else {
      adminUserId = adminResult.rows[0].user_id;
      console.log('Admin user already exists');
    }

    // 3. Create employees and users
    console.log('Creating employees and users...');
    const employeeIds = [];
    const userIds = [adminUserId]; // Include admin user
    const managerIds = []; // Keep track of potential managers

    // Create 100+ employees
    for (let i = 0; i < 120; i++) {
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`;
      const role = i < 5 ? 'admin' : i < 20 ? 'manager' : 'employee';
      const departmentId = getRandomItem(departmentIds);
      
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );
      
      let userId;
      if (existingUser.rows.length === 0) {
        // Create user
        const password = await bcrypt.hash('employee123', 10);
        const userResult = await client.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id',
          [email, password, role]
        );
        userId = userResult.rows[0].user_id;
      } else {
        userId = existingUser.rows[0].user_id;
        // Update role if needed
        await client.query(
          'UPDATE users SET role = $1 WHERE user_id = $2',
          [role, userId]
        );
      }
      userIds.push(userId);
      
      // Check if employee already exists
      const existingEmployee = await client.query(
        'SELECT employee_id FROM employees WHERE user_id = $1',
        [userId]
      );
      
      let employeeId;
      if (existingEmployee.rows.length === 0) {
        // Create employee
        const hireDate = getRandomDate(new Date(2020, 0, 1), new Date(2024, 11, 31));
        const salary = Math.floor(Math.random() * 80000) + 40000; // 40k to 120k
        const position = getRandomItem(positions);
        
        const employeeResult = await client.query(
          'INSERT INTO employees (user_id, first_name, last_name, email, phone, date_of_birth, gender, address, department_id, position, hire_date, salary, employment_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING employee_id',
          [
            userId, firstName, lastName, email, 
            `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            getRandomDate(new Date(1970, 0, 1), new Date(1995, 11, 31)).toISOString().split('T')[0],
            Math.random() > 0.5 ? 'Male' : 'Female',
            `${Math.floor(Math.random() * 9999) + 1} ${getRandomItem(['Main', 'Oak', 'Pine', 'Elm', 'Maple'])} St, ${getRandomItem(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'])}, ${getRandomItem(['NY', 'CA', 'IL', 'TX', 'AZ'])} ${Math.floor(Math.random() * 90000) + 10000}`,
            departmentId, position, hireDate.toISOString().split('T')[0], salary,
            getRandomItem(['Full-time', 'Part-time', 'Contract']), 'active'
          ]
        );
        
        employeeId = employeeResult.rows[0].employee_id;
      } else {
        employeeId = existingEmployee.rows[0].employee_id;
        // Update employee info
        const salary = Math.floor(Math.random() * 80000) + 40000; // 40k to 120k
        const position = getRandomItem(positions);
        const hireDate = getRandomDate(new Date(2020, 0, 1), new Date(2024, 11, 31));
        
        await client.query(
          'UPDATE employees SET first_name = $1, last_name = $2, department_id = $3, position = $4, hire_date = $5, salary = $6 WHERE employee_id = $7',
          [firstName, lastName, departmentId, position, hireDate.toISOString().split('T')[0], salary, employeeId]
        );
      }
      
      employeeIds.push(employeeId);
      
      // Keep track of managers
      if (role === 'manager') {
        managerIds.push(employeeId);
      }
    }
    console.log(`Created/Updated ${employeeIds.length} employees`);

    // 4. Update departments with managers
    console.log('Assigning managers to departments...');
    for (let i = 0; i < departmentIds.length && i < managerIds.length; i++) {
      await client.query(
        'UPDATE departments SET manager_id = $1 WHERE department_id = $2',
        [managerIds[i], departmentIds[i]]
      );
    }

    // 5. Create attendance records
    console.log('Creating attendance records...');
    let attendanceCount = 0;
    const today = new Date();
    // Create attendance records for the last 90 days
    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Create attendance for each employee
      for (const employeeId of employeeIds) {
        // Skip weekends for most employees (90% chance)
        const dayOfWeek = date.getDay();
        if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.1) {
          continue;
        }
        
        // Check if attendance record already exists
        const existingAttendance = await client.query(
          'SELECT attendance_id FROM attendance WHERE employee_id = $1 AND date = $2',
          [employeeId, date.toISOString().split('T')[0]]
        );
        
        if (existingAttendance.rows.length === 0) {
          // Randomly decide if employee is present, late, or absent
          const status = Math.random() > 0.95 ? 'absent' : Math.random() > 0.9 ? 'late' : 'present';
          let clockIn, clockOut, workHours;
          
          if (status !== 'absent') {
            // Clock in time (between 8:00 AM and 10:00 AM)
            const clockInHour = 8 + Math.floor(Math.random() * 3);
            const clockInMinute = Math.floor(Math.random() * 60);
            clockIn = `${clockInHour.toString().padStart(2, '0')}:${clockInMinute.toString().padStart(2, '0')}:00`;
            
            // Clock out time (between 4:00 PM and 7:00 PM)
            const clockOutHour = 16 + Math.floor(Math.random() * 4);
            const clockOutMinute = Math.floor(Math.random() * 60);
            clockOut = `${clockOutHour.toString().padStart(2, '0')}:${clockOutMinute.toString().padStart(2, '0')}:00`;
            
            // Calculate work hours
            workHours = (clockOutHour + clockOutMinute/60) - (clockInHour + clockInMinute/60);
            if (workHours < 0) workHours += 24; // Handle overnight shifts
          }
          
          await client.query(
            'INSERT INTO attendance (employee_id, date, clock_in, clock_out, status, work_hours) VALUES ($1, $2, $3, $4, $5, $6)',
            [employeeId, date.toISOString().split('T')[0], clockIn, clockOut, status, workHours]
          );
          attendanceCount++;
        }
      }
    }
    console.log(`Created ${attendanceCount} new attendance records`);

    // 6. Create leave requests
    console.log('Creating leave requests...');
    let leaveCount = 0;
    for (const employeeId of employeeIds) {
      // Count existing leave requests for this employee
      const existingLeaves = await client.query(
        'SELECT COUNT(*) as count FROM leave_requests WHERE employee_id = $1',
        [employeeId]
      );
      
      const currentLeaveCount = parseInt(existingLeaves.rows[0].count);
      
      // Create 3-8 leave requests per employee (only if they don't already have enough)
      const numLeaves = Math.min(8, Math.max(3, 8 - currentLeaveCount));
      if (numLeaves > 0) {
        for (let i = 0; i < numLeaves; i++) {
          const leaveType = getRandomItem(leaveTypes);
          const startDate = getRandomFutureDate(365);
          const duration = Math.floor(Math.random() * 10) + 1; // 1-10 days
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + duration);
          
          // Randomly assign status
          const statuses = ['pending', 'approved', 'rejected'];
          const status = getRandomItem(statuses);
          let approvedBy = null;
          let approvedAt = null;
          let rejectionReason = null;
          
          if (status === 'approved' || status === 'rejected') {
            approvedBy = getRandomItem(userIds.filter(id => id !== employeeId)); // Different user approves
            approvedAt = new Date();
            if (status === 'rejected') {
              rejectionReason = 'Not enough notice';
            }
          }
          
          await client.query(
            'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason, status, approved_by, approved_at, rejection_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [
              employeeId, leaveType, startDate.toISOString().split('T')[0], 
              endDate.toISOString().split('T')[0], duration,
              `Personal ${leaveType.toLowerCase()} request`,
              status, approvedBy, approvedAt, rejectionReason
            ]
          );
          leaveCount++;
        }
      }
    }
    console.log(`Created ${leaveCount} new leave requests`);

    // 7. Create tasks
    console.log('Creating tasks...');
    // Count existing tasks
    const existingTasks = await client.query('SELECT COUNT(*) as count FROM tasks');
    const currentTaskCount = parseInt(existingTasks.rows[0].count);
    let taskCount = 0;
    
    // Create up to 150 tasks (only if we don't already have enough)
    const numTasksToCreate = Math.max(0, 150 - currentTaskCount);
    for (let i = 0; i < numTasksToCreate; i++) {
      const createdBy = getRandomItem(userIds);
      const departmentId = getRandomItem(departmentIds);
      const priorities = ['low', 'medium', 'high', 'urgent'];
      const priority = getRandomItem(priorities);
      const statuses = ['todo', 'in_progress', 'completed'];
      const status = getRandomItem(statuses);
      
      const result = await client.query(
        'INSERT INTO tasks (title, description, priority, status, due_date, created_by, department_id, estimated_hours, actual_hours, progress) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING task_id',
        [
          `Task ${i+1}: ${getRandomItem(['Implement', 'Review', 'Design', 'Test', 'Document', 'Optimize'])} ${getRandomItem(['feature', 'system', 'module', 'component'])}`,
          `Detailed description for task ${i+1}. This involves ${getRandomItem(['research', 'development', 'testing', 'documentation'])} of the ${getRandomItem(['new', 'existing', 'updated'])} ${getRandomItem(['feature', 'system', 'module', 'component'])}.`,
          priority, status,
          getRandomFutureDate(180).toISOString().split('T')[0],
          createdBy, departmentId,
          Math.floor(Math.random() * 40) + 5, // 5-45 hours
          Math.floor(Math.random() * 50), // 0-49 hours
          Math.floor(Math.random() * 101) // 0-100%
        ]
      );
      
      const taskId = result.rows[0].task_id;
      taskCount++;
      
      // Assign task to 1-3 employees
      const numAssignments = Math.floor(Math.random() * 3) + 1;
      const assignedEmployees = [];
      while (assignedEmployees.length < numAssignments && assignedEmployees.length < employeeIds.length) {
        const employeeId = getRandomItem(employeeIds);
        if (!assignedEmployees.includes(employeeId)) {
          assignedEmployees.push(employeeId);
          // Check if assignment already exists
          const existingAssignment = await client.query(
            'SELECT assignment_id FROM task_assignments WHERE task_id = $1 AND employee_id = $2',
            [taskId, employeeId]
          );
          
          if (existingAssignment.rows.length === 0) {
            await client.query(
              'INSERT INTO task_assignments (task_id, employee_id) VALUES ($1, $2)',
              [taskId, employeeId]
            );
          }
        }
      }
      
      // Add task updates
      if (status !== 'todo') {
        const numUpdates = Math.floor(Math.random() * 5) + 1;
        for (let j = 0; j < numUpdates; j++) {
          const employeeId = getRandomItem(assignedEmployees);
          await client.query(
            'INSERT INTO task_updates (task_id, employee_id, update_text, hours_spent, progress_percentage, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              taskId, employeeId,
              `Update ${j+1} for task ${i+1}. ${getRandomItem(['Made progress', 'Encountered issues', 'Completed phase', 'Requested assistance'])}.`,
              Math.random() * 8, // 0-8 hours
              Math.min(100, Math.floor(Math.random() * 30) + (j * 25)), // Progress increases with updates
              getRandomItem(['working', 'blocked', 'completed'])
            ]
          );
        }
      }
    }
    console.log(`Created ${taskCount} new tasks`);

    // 8. Create payroll records
    console.log('Creating payroll records...');
    let payrollCount = 0;
    // Create payroll for last 12 months
    for (let month = 1; month <= 12; month++) {
      for (const employeeId of employeeIds) {
        // Check if payroll record already exists
        const existingPayroll = await client.query(
          'SELECT payroll_id FROM payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
          [employeeId, month, new Date().getFullYear()]
        );
        
        if (existingPayroll.rows.length === 0) {
          // Get employee salary
          const empResult = await client.query(
            'SELECT salary FROM employees WHERE employee_id = $1',
            [employeeId]
          );
          
          if (empResult.rows.length > 0) {
            const baseSalary = empResult.rows[0].salary / 12; // Monthly salary
            const year = new Date().getFullYear();
            
            // Calculate payroll components
            const allowances = Math.floor(Math.random() * 1000);
            const deductions = Math.floor(Math.random() * 500);
            const overtime = Math.random() > 0.7 ? Math.floor(Math.random() * 500) : 0;
            const bonus = Math.random() > 0.8 ? Math.floor(Math.random() * 2000) : 0;
            const taxRate = 0.20; // 20% tax
            const tax = (baseSalary + allowances + overtime + bonus) * taxRate;
            const netSalary = baseSalary + allowances + overtime + bonus - deductions - tax;
            
            const paymentStatuses = ['pending', 'processed', 'paid'];
            const paymentStatus = getRandomItem(paymentStatuses);
            let paymentDate = null;
            if (paymentStatus === 'paid') {
              paymentDate = new Date(year, month - 1, Math.floor(Math.random() * 15) + 10);
            }
            
            try {
              await client.query(
                'INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, overtime_pay, bonus, tax, net_salary, payment_date, payment_status, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
                [
                  employeeId, month, year, baseSalary, allowances, deductions,
                  overtime, bonus, tax, netSalary, paymentDate,
                  paymentStatus, getRandomItem(['Direct Deposit', 'Check', 'Cash'])
                ]
              );
              payrollCount++;
            } catch (error) {
              // Ignore duplicate key errors (already exists)
              if (!error.message.includes('duplicate key')) {
                throw error;
              }
            }
          }
        }
      }
    }
    console.log(`Created ${payrollCount} new payroll records`);

    // 9. Create job postings
    console.log('Creating job postings...');
    // Count existing job postings
    const existingJobs = await client.query('SELECT COUNT(*) as count FROM job_postings');
    const currentJobCount = parseInt(existingJobs.rows[0].count);
    let jobCount = 0;
    
    // Create up to 30 job postings (only if we don't already have enough)
    const numJobsToCreate = Math.max(0, 30 - currentJobCount);
    for (let i = 0; i < numJobsToCreate; i++) {
      const departmentId = getRandomItem(departmentIds);
      const postedBy = getRandomItem(userIds);
      const statuses = ['open', 'closed', 'filled'];
      const status = getRandomItem(statuses);
      
      await client.query(
        'INSERT INTO job_postings (title, description, department_id, position_type, experience_required, salary_range, location, requirements, responsibilities, status, posted_by, deadline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [
          `${getRandomItem(positions)} - ${getRandomItem(departments)}`,
          `We are looking for a talented ${getRandomItem(positions)} to join our ${getRandomItem(departments)} team. This position involves ${getRandomItem(['developing', 'managing', 'supporting', 'leading'])} ${getRandomItem(['projects', 'teams', 'systems', 'initiatives'])}.`,
          departmentId,
          getRandomItem(['Full-time', 'Part-time', 'Contract', 'Intern']),
          `${Math.floor(Math.random() * 8) + 1}+ years`,
          `$${Math.floor(Math.random() * 50000) + 50000} - $${Math.floor(Math.random() * 70000) + 80000}`,
          getRandomItem(['New York', 'San Francisco', 'Chicago', 'Remote', 'Austin']),
          `Requirements include ${getRandomItem(['Bachelor\'s degree', 'Master\'s degree', 'PhD'])} in ${getRandomItem(['Computer Science', 'Business', 'Engineering', 'Mathematics'])} and ${getRandomItem(['experience', 'knowledge', 'skills'])} in ${getRandomItem(['JavaScript', 'Python', 'Java', 'React', 'Node.js'])}.`,
          `Responsibilities include ${getRandomItem(['developing', 'designing', 'implementing', 'maintaining'])} ${getRandomItem(['software', 'systems', 'applications', 'solutions'])}, ${getRandomItem(['collaborating', 'working', 'partnering'])} with ${getRandomItem(['cross-functional teams', 'stakeholders', 'clients'])}, and ${getRandomItem(['delivering', 'producing', 'creating'])} ${getRandomItem(['high-quality', 'innovative', 'scalable'])} ${getRandomItem(['solutions', 'products', 'services'])}.`,
          status, postedBy,
          getRandomFutureDate(90).toISOString().split('T')[0]
        ]
      );
      jobCount++;
    }
    console.log(`Created ${jobCount} new job postings`);

    // 10. Create job applications
    console.log('Creating job applications...');
    let applicationCount = 0;
    // Get all job postings
    const jobResult = await client.query('SELECT job_id FROM job_postings');
    const jobIds = jobResult.rows.map(row => row.job_id);
    
    for (const jobId of jobIds) {
      // Count existing applications for this job
      const existingApps = await client.query(
        'SELECT COUNT(*) as count FROM job_applications WHERE job_id = $1',
        [jobId]
      );
      
      const currentAppCount = parseInt(existingApps.rows[0].count);
      
      // Create 5-15 applications per job (only if they don't already have enough)
      const numApplications = Math.min(15, Math.max(5, 15 - currentAppCount));
      if (numApplications > 0) {
        for (let i = 0; i < numApplications; i++) {
          const firstName = getRandomItem(firstNames);
          const lastName = getRandomItem(lastNames);
          
          const statuses = ['submitted', 'reviewed', 'interview', 'rejected', 'hired'];
          const status = getRandomItem(statuses);
          let interviewDate = null;
          if (status === 'interview') {
            interviewDate = getRandomFutureDate(30);
          }
          
          await client.query(
            'INSERT INTO job_applications (job_id, applicant_name, email, phone, resume_url, cover_letter, experience_years, current_salary, expected_salary, status, interview_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [
              jobId,
              `${firstName} ${lastName}`,
              `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
              `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              `https://example.com/resumes/${firstName}_${lastName}_resume.pdf`,
              `I am excited to apply for this position. With ${Math.floor(Math.random() * 10) + 1} years of experience in ${getRandomItem(['software development', 'project management', 'data analysis', 'marketing'])}, I believe I would be a valuable addition to your team.`,
              Math.floor(Math.random() * 15) + 1, // 1-15 years
              Math.floor(Math.random() * 100000) + 50000, // 50k-150k
              Math.floor(Math.random() * 120000) + 60000, // 60k-180k
              status, interviewDate
            ]
          );
          applicationCount++;
        }
      }
    }
    console.log(`Created ${applicationCount} new job applications`);

    // 11. Create documents
    console.log('Creating documents...');
    let documentCount = 0;
    for (const employeeId of employeeIds) {
      // Count existing documents for this employee
      const existingDocs = await client.query(
        'SELECT COUNT(*) as count FROM documents WHERE employee_id = $1',
        [employeeId]
      );
      
      const currentDocCount = parseInt(existingDocs.rows[0].count);
      
      // Create 2-5 documents per employee (only if they don't already have enough)
      const numDocuments = Math.min(5, Math.max(2, 5 - currentDocCount));
      if (numDocuments > 0) {
        for (let i = 0; i < numDocuments; i++) {
          const documentType = getRandomItem(documentTypes);
          const uploadedBy = getRandomItem(userIds);
          const isConfidential = Math.random() > 0.8;
          
          await client.query(
            'INSERT INTO documents (employee_id, document_type, document_name, file_url, file_size, uploaded_by, description, is_confidential) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [
              employeeId, documentType,
              `${documentType} - ${getRandomItem(['Q1', 'Q2', 'Q3', 'Q4'])} ${new Date().getFullYear()}`,
              `https://example.com/documents/${employeeId}_${documentType.toLowerCase().replace(' ', '_')}_${i+1}.pdf`,
              Math.floor(Math.random() * 5000) + 100, // 100KB-5MB
              uploadedBy,
              `This is a ${documentType.toLowerCase()} document for ${getRandomItem(['employee', 'department', 'company'])} ${getRandomItem(['records', 'compliance', 'review'])}.`,
              isConfidential
            ]
          );
          documentCount++;
        }
      }
    }
    console.log(`Created ${documentCount} new documents`);

    // 12. Create chat messages
    console.log('Creating chat messages...');
    // Count existing messages
    const existingMessages = await client.query('SELECT COUNT(*) as count FROM chat_messages');
    const currentMessageCount = parseInt(existingMessages.rows[0].count);
    let messageCount = 0;
    
    // Create up to 500 chat messages (only if we don't already have enough)
    const numMessagesToCreate = Math.max(0, 500 - currentMessageCount);
    for (let i = 0; i < numMessagesToCreate; i++) {
      const senderId = getRandomItem(userIds);
      let receiverId;
      do {
        receiverId = getRandomItem(userIds);
      } while (receiverId === senderId);
      
      const isRead = Math.random() > 0.3;
      let readAt = null;
      if (isRead) {
        readAt = new Date();
      }
      
      await client.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message, is_read, read_at) VALUES ($1, $2, $3, $4, $5)',
        [
          senderId, receiverId,
          `${getRandomItem(['Hi', 'Hello', 'Hey', 'Good morning', 'Good afternoon'])}, ${getRandomItem(['how are you', 'how is it going', 'hope you\'re doing well', 'hope everything is fine'])}? ${getRandomItem(['', 'I wanted to discuss', 'Can we talk about', 'I need help with', 'Quick question about'])} ${getRandomItem(['the project', 'the meeting', 'the deadline', 'the report', 'the issue'])}.`,
          isRead, readAt
        ]
      );
      messageCount++;
    }
    console.log(`Created ${messageCount} new chat messages`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('All dummy data created successfully!');
    
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error generating dummy data:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
};

// Run the script
generateDummyData();