const { query } = require('../../../config/database');

/**
 * Employee Domain Tools for HR AI Operations Agent
 */
const employeeTools = [
  {
    name: 'searchEmployees',
    domain: 'employee',
    description: 'Search employees by name, code, department, position, or status with disambiguation support.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        query_text: { type: 'string', description: 'Name, employee code, or keyword to search' },
        department_name: { type: 'string', description: 'Filter by department' },
        status: { type: 'string', enum: ['active', 'inactive', 'on_leave', 'resigned', 'all'], description: 'Filter by status' }
      },
      required: ['query_text']
    },
    execute: async (args, context) => {
      const { query_text, department_name, status } = args;
      const { user } = context;
      const role = user?.role || 'employee';

      let sql = `
        SELECT e.employee_id, e.employee_code, e.first_name, e.last_name, e.email, e.phone,
               e.position, e.status, e.hire_date, e.joining_date, d.department_name,
               ${role === 'admin' || role === 'hr' || user?.isSuperAdmin ? 'e.salary, e.pan, e.bank_account, e.bank_name, e.ifsc_code, e.uan, e.esic,' : ''}
               m.first_name || ' ' || m.last_name as manager_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
        WHERE 1=1
      `;
      const params = [];
      let pIdx = 1;

      if (query_text && query_text.trim() !== '' && query_text !== 'all') {
        sql += ` AND (e.first_name ILIKE $${pIdx} OR e.last_name ILIKE $${pIdx} OR (e.first_name || ' ' || e.last_name) ILIKE $${pIdx} OR e.employee_code ILIKE $${pIdx} OR e.email ILIKE $${pIdx})`;
        params.push(`%${query_text.trim()}%`);
        pIdx++;
      }

      if (department_name) {
        sql += ` AND d.department_name ILIKE $${pIdx}`;
        params.push(`%${department_name.trim()}%`);
        pIdx++;
      }

      if (status && status !== 'all') {
        sql += ` AND e.status = $${pIdx}`;
        params.push(status);
        pIdx++;
      }

      sql += ` ORDER BY e.created_at DESC LIMIT 20`;

      const res = await query(sql, params);
      const employees = res.rows;

      if (employees.length === 0) {
        return {
          success: true,
          count: 0,
          disambiguation_needed: false,
          data: [],
          message: `No employees found matching "${query_text}".`
        };
      }

      if (employees.length > 1 && query_text && !['all', 'employees', 'staff', 'team'].includes(query_text.toLowerCase())) {
        return {
          success: true,
          count: employees.length,
          disambiguation_needed: true,
          data: employees,
          disambiguation_options: employees.map(e => ({
            employee_id: e.employee_id,
            employee_code: e.employee_code,
            name: `${e.first_name} ${e.last_name || ''}`.trim(),
            department: e.department_name || 'Unassigned',
            position: e.position || 'Staff'
          })),
          message: `Found ${employees.length} employees matching "${query_text}". Disambiguation required.`
        };
      }

      return {
        success: true,
        count: employees.length,
        disambiguation_needed: false,
        data: employees,
        message: `Found ${employees.length} employee record(s).`
      };
    }
  },

  {
    name: 'getEmployeeProfile',
    domain: 'employee',
    description: 'Retrieve full profile details for a specific employee by ID or Code.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Employee ID' },
        employee_code: { type: 'string', description: 'Employee Code (e.g. EMP0001)' }
      }
    },
    execute: async (args, context) => {
      const { employee_id, employee_code } = args;
      const { user } = context;
      const role = user?.role || 'employee';

      let sql = `
        SELECT e.*, d.department_name, u.email as user_email, u.is_active as user_active,
               m.first_name || ' ' || m.last_name as manager_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN users u ON e.user_id = u.user_id
        LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
        WHERE 1=1
      `;
      const params = [];
      if (employee_id) {
        sql += ` AND e.employee_id = $1`;
        params.push(employee_id);
      } else if (employee_code) {
        sql += ` AND e.employee_code ILIKE $1`;
        params.push(employee_code.trim());
      } else {
        return { success: false, message: 'Please provide either employee_id or employee_code.' };
      }

      const res = await query(sql, params);
      if (res.rows.length === 0) {
        return { success: false, message: 'Employee profile not found.' };
      }

      const emp = res.rows[0];
      // Role masking: Non-HR/Admins cannot view sensitive statutory or salary fields of others
      if (role !== 'admin' && role !== 'hr' && !context.isSuperAdmin && emp.user_id !== user.userId) {
        delete emp.salary;
        delete emp.pan;
        delete emp.bank_account;
        delete emp.bank_name;
        delete emp.ifsc_code;
        delete emp.uan;
        delete emp.esic;
      }

      return {
        success: true,
        data: emp,
        message: `Profile loaded for ${emp.first_name} ${emp.last_name || ''} (${emp.employee_code || 'EMP' + emp.employee_id}).`
      };
    }
  },

  {
    name: 'createEmployee',
    domain: 'employee',
    description: 'Create a new employee profile and generate associated portal user login credentials. Restricted to Admin and HR.',
    type: 'write',
    isSensitive: false,
    requiredRole: ['admin', 'hr', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        first_name: { type: 'string', description: 'First Name (Mandatory)' },
        last_name: { type: 'string', description: 'Last Name' },
        email: { type: 'string', description: 'Work Email (Mandatory)' },
        position: { type: 'string', description: 'Job Title / Role (Mandatory)' },
        department_name: { type: 'string', description: 'Department Name (Mandatory)' },
        salary: { type: 'number', description: 'Monthly Base Salary (₹) (Mandatory)' },
        employment_type: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'intern'], description: 'Employment Type' },
        phone: { type: 'string', description: 'Contact Phone Number' },
        gender: { type: 'string', enum: ['male', 'female', 'other'], description: 'Gender' },
        date_of_birth: { type: 'string', description: 'Date of Birth (YYYY-MM-DD)' },
        joining_date: { type: 'string', description: 'Joining Date (YYYY-MM-DD)' },
        address: { type: 'string', description: 'Residential Address' },
        pan: { type: 'string', description: 'Indian PAN Number' },
        bank_name: { type: 'string', description: 'Bank Name' },
        bank_account: { type: 'string', description: 'Bank Account Number' },
        ifsc_code: { type: 'string', description: 'IFSC Code' },
        uan: { type: 'string', description: '12-digit UAN PF' },
        esic: { type: 'string', description: '17-digit ESIC Code' }
      },
      required: ['first_name', 'email', 'position', 'salary']
    },
    execute: async (args, context) => {
      const {
        first_name,
        last_name = '',
        email,
        position,
        department_name,
        salary,
        employment_type = 'full-time',
        phone = null,
        gender = 'male',
        date_of_birth = null,
        joining_date = null,
        address = null,
        pan = null,
        bank_name = null,
        bank_account = null,
        ifsc_code = null,
        uan = null,
        esic = null
      } = args;

      // 1. Duplicate check
      const dupCheck = await query('SELECT employee_id, first_name, last_name, employee_code FROM employees WHERE email ILIKE $1', [email.trim()]);
      if (dupCheck.rows.length > 0) {
        const exist = dupCheck.rows[0];
        return {
          success: false,
          isDuplicate: true,
          message: `An employee profile already exists with email "${email}" (${exist.first_name} ${exist.last_name || ''} - ${exist.employee_code}).`
        };
      }

      // 2. Department resolution
      let deptId = null;
      if (department_name) {
        const dRes = await query('SELECT department_id FROM departments WHERE department_name ILIKE $1 LIMIT 1', [`%${department_name.trim()}%`]);
        if (dRes.rows.length > 0) deptId = dRes.rows[0].department_id;
      }
      if (!deptId) {
        const anyDept = await query('SELECT department_id FROM departments LIMIT 1');
        if (anyDept.rows.length > 0) deptId = anyDept.rows[0].department_id;
      }

      // 3. User account creation / link
      let newUserId = null;
      try {
        const existingUser = await query('SELECT user_id FROM users WHERE email ILIKE $1', [email.trim()]);
        if (existingUser.rows.length > 0) {
          newUserId = existingUser.rows[0].user_id;
        } else {
          const bcrypt = require('bcryptjs');
          const hash = await bcrypt.hash('employee123', 10);
          const uRes = await query(
            'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, true) RETURNING user_id',
            [email.trim().toLowerCase(), hash, 'employee']
          );
          newUserId = uRes.rows[0].user_id;
        }
      } catch (uErr) {
        console.warn('[EmployeeTool] User creation notice:', uErr.message);
      }

      const targetJoiningDate = joining_date || new Date().toISOString().split('T')[0];

      // 4. Insert into database
      const insertRes = await query(
        `INSERT INTO employees (
          user_id, first_name, last_name, email, phone, gender, date_of_birth, address,
          position, department_id, salary, employment_type, status, hire_date, joining_date,
          pan, bank_account, bank_name, ifsc_code, uan, esic
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $13, $14, $15, $16, $17, $18, $19)
        RETURNING employee_id, first_name, last_name, email, position, salary, hire_date, joining_date`,
        [
          newUserId, first_name.trim(), last_name ? last_name.trim() : '', email.trim().toLowerCase(),
          phone ? phone.trim() : null, gender, date_of_birth, address ? address.trim() : null,
          position.trim(), deptId, salary, employment_type, targetJoiningDate,
          pan ? pan.trim().toUpperCase() : null, bank_account ? bank_account.trim() : null,
          bank_name ? bank_name.trim() : null, ifsc_code ? ifsc_code.trim().toUpperCase() : null,
          uan ? uan.trim() : null, esic ? esic.trim() : null
        ]
      );

      const emp = insertRes.rows[0];
      const code = `EMP${String(emp.employee_id).padStart(4, '0')}`;
      await query('UPDATE employees SET employee_code = $1 WHERE employee_id = $2', [code, emp.employee_id]);

      // 5. Post-Operation Verification
      const verifyRes = await query('SELECT employee_id, employee_code, status FROM employees WHERE employee_id = $1', [emp.employee_id]);
      if (verifyRes.rows.length === 0) {
        return { success: false, message: 'Database write verification failed. Record was not committed.' };
      }

      return {
        success: true,
        data: { ...emp, employee_code: code, status: 'active' },
        message: `Employee **${emp.first_name} ${emp.last_name || ''}** (${code}) created successfully with role **${emp.position}** and salary **₹${Number(emp.salary).toLocaleString('en-IN')}**.`,
        action_card: {
          type: 'employee_card',
          title: `Created: ${emp.first_name} ${emp.last_name || ''}`,
          subtitle: `${emp.position} • ${code} • ₹${Number(emp.salary).toLocaleString('en-IN')}`,
          link: `/profile?id=${emp.employee_id}`
        }
      };
    }
  },

  {
    name: 'updateEmployee',
    domain: 'employee',
    description: 'Update employee information (designation, salary, department, phone, status). Restricted to Admin and HR.',
    type: 'write',
    isSensitive: false,
    requiredRole: ['admin', 'hr', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Employee ID' },
        employee_code: { type: 'string', description: 'Employee Code' },
        position: { type: 'string', description: 'New Designation / Role' },
        salary: { type: 'number', description: 'New Monthly Salary (₹)' },
        department_name: { type: 'string', description: 'New Department' },
        phone: { type: 'string', description: 'New Contact Phone' },
        status: { type: 'string', enum: ['active', 'inactive', 'on_leave', 'resigned', 'terminated'] }
      },
      required: []
    },
    execute: async (args, context) => {
      const { employee_id, employee_code, position, salary, department_name, phone, status } = args;

      let empId = employee_id;
      if (!empId && employee_code) {
        const cRes = await query('SELECT employee_id FROM employees WHERE employee_code ILIKE $1', [employee_code.trim()]);
        if (cRes.rows.length > 0) empId = cRes.rows[0].employee_id;
      }
      if (!empId) return { success: false, message: 'Please provide a valid employee_id or employee_code to update.' };

      let deptId = undefined;
      if (department_name) {
        const dRes = await query('SELECT department_id FROM departments WHERE department_name ILIKE $1 LIMIT 1', [`%${department_name.trim()}%`]);
        if (dRes.rows.length > 0) deptId = dRes.rows[0].department_id;
      }

      const updates = [];
      const params = [];
      let pIdx = 1;

      if (position !== undefined) { updates.push(`position = $${pIdx}`); params.push(position.trim()); pIdx++; }
      if (salary !== undefined) { updates.push(`salary = $${pIdx}`); params.push(salary); pIdx++; }
      if (deptId !== undefined) { updates.push(`department_id = $${pIdx}`); params.push(deptId); pIdx++; }
      if (phone !== undefined) { updates.push(`phone = $${pIdx}`); params.push(phone ? phone.trim() : null); pIdx++; }
      if (status !== undefined) { updates.push(`status = $${pIdx}`); params.push(status); pIdx++; }

      if (updates.length === 0) {
        return { success: false, message: 'No updated fields provided.' };
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(empId);

      const sql = `UPDATE employees SET ${updates.join(', ')} WHERE employee_id = $${pIdx} RETURNING employee_id, employee_code, first_name, last_name, position, salary, status`;
      const res = await query(sql, params);

      if (res.rows.length === 0) {
        return { success: false, message: 'Employee not found for update.' };
      }

      const updated = res.rows[0];
      return {
        success: true,
        data: updated,
        message: `Updated profile for **${updated.first_name} ${updated.last_name || ''}** (${updated.employee_code}): Position: ${updated.position}, Salary: ₹${Number(updated.salary).toLocaleString('en-IN')}, Status: ${updated.status}.`
      };
    }
  },

  {
    name: 'deactivateEmployee',
    domain: 'employee',
    description: 'Deactivate an employee and revoke active portal login access. High-impact action requiring human confirmation.',
    type: 'sensitive_write',
    isSensitive: true,
    requiredRole: ['admin', 'hr', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Employee ID' },
        employee_code: { type: 'string', description: 'Employee Code' },
        employee_name: { type: 'string', description: 'Employee Name for search' },
        reason: { type: 'string', description: 'Reason for deactivation (e.g. Resigned, Contract Complete, Terminated)' }
      }
    },
    execute: async (args, context) => {
      const { employee_id, employee_code, employee_name, reason = 'Deactivated by HR' } = args;

      let emp = null;
      if (employee_id) {
        const res = await query('SELECT employee_id, user_id, employee_code, first_name, last_name, position FROM employees WHERE employee_id = $1', [employee_id]);
        if (res.rows.length > 0) emp = res.rows[0];
      } else if (employee_code) {
        const res = await query('SELECT employee_id, user_id, employee_code, first_name, last_name, position FROM employees WHERE employee_code ILIKE $1', [employee_code.trim()]);
        if (res.rows.length > 0) emp = res.rows[0];
      } else if (employee_name) {
        const res = await query('SELECT employee_id, user_id, employee_code, first_name, last_name, position FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR (first_name || \' \' || last_name) ILIKE $1', [`%${employee_name.trim()}%`]);
        if (res.rows.length > 0) emp = res.rows[0];
      }

      if (!emp) return { success: false, message: 'Target employee not found for deactivation.' };

      // Update employee status
      await query('UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2', ['inactive', emp.employee_id]);

      // Deactivate user login account
      if (emp.user_id) {
        await query('UPDATE users SET is_active = false WHERE user_id = $1', [emp.user_id]);
      }

      // Verification
      const vRes = await query('SELECT status FROM employees WHERE employee_id = $1', [emp.employee_id]);
      if (vRes.rows.length === 0 || vRes.rows[0].status !== 'inactive') {
        return { success: false, message: 'Deactivation verification failed.' };
      }

      return {
        success: true,
        data: { employee_id: emp.employee_id, employee_code: emp.employee_code, status: 'inactive' },
        message: `Employee **${emp.first_name} ${emp.last_name || ''}** (${emp.employee_code}) has been deactivated. Reason: "${reason}". Portal login access has been suspended.`
      };
    }
  }
];

module.exports = employeeTools;
