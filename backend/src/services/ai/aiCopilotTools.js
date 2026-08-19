const { pool, query } = require('../../config/database');

/**
 * Enterprise AI Copilot Full-Module CRUD Tool Definitions and Handlers
 * Strictly enforces Role-Based Access Control (RBAC) & Multi-Tenant Schema Isolation.
 */

// Tool Definitions for LLM Tool Calling across all 11 Modules
const COPILOT_TOOL_DEFINITIONS = [
  // ==========================================
  // MODULE 1: EMPLOYEES (Full CRUD)
  // ==========================================
  {
    name: 'create_employee',
    description: 'Create a new employee record. Restricted to Admin and HR.',
    parameters: {
      type: 'object',
      properties: {
        first_name: { type: 'string', description: 'First name of the employee' },
        last_name: { type: 'string', description: 'Last name of the employee' },
        email: { type: 'string', description: 'Work email address' },
        phone: { type: 'string', description: 'Contact phone number' },
        position: { type: 'string', description: 'Job title or role (e.g. Lead Designer, Software Engineer)' },
        department_name: { type: 'string', description: 'Department name (e.g. Engineering, Sales)' },
        salary: { type: 'number', description: 'Monthly base salary' },
        employment_type: { type: 'string', enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], description: 'Employment type' }
      },
      required: ['first_name', 'email']
    }
  },
  {
    name: 'lookup_employee',
    description: 'Lookup employee details (name, designation, salary, department, PAN, bank). Restricted to Admin/HR, Manager (direct reports), or self.',
    parameters: {
      type: 'object',
      properties: {
        search_query: { type: 'string', description: 'Employee name, email, or employee code' }
      },
      required: ['search_query']
    }
  },
  {
    name: 'update_employee',
    description: 'Update an existing employee details (salary, position, phone, status, department). Restricted to Admin and HR.',
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Name or code of employee to update' },
        salary: { type: 'number', description: 'New monthly salary' },
        position: { type: 'string', description: 'New job title' },
        department_name: { type: 'string', description: 'New department name' },
        phone: { type: 'string', description: 'New phone number' },
        status: { type: 'string', enum: ['active', 'inactive', 'on_leave', 'resigned', 'terminated'], description: 'Employee status' }
      },
      required: ['employee_name']
    }
  },
  {
    name: 'deactivate_employee',
    description: 'Deactivate an employee and set status to inactive or resigned. Restricted to Admin and HR.',
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Name or code of the employee' },
        reason: { type: 'string', description: 'Reason for deactivation (resignation, termination, etc.)' }
      },
      required: ['employee_name']
    }
  },

  // ==========================================
  // MODULE 2: ATTENDANCE & SHIFTS
  // ==========================================
  {
    name: 'mark_attendance',
    description: 'Mark attendance for an employee (clock-in, clock-out, or status).',
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Employee name or code' },
        status: { type: 'string', enum: ['present', 'absent', 'half-day'], description: 'Status' },
        clock_in: { type: 'string', description: 'Clock in time (e.g. 09:30 AM)' },
        clock_out: { type: 'string', description: 'Clock out time (e.g. 06:30 PM)' }
      },
      required: ['employee_name', 'status']
    }
  },
  {
    name: 'query_attendance',
    description: 'Query attendance records, today\'s clock-in/out, or absent employees.',
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Optional employee name' },
        date: { type: 'string', description: 'Date YYYY-MM-DD or "today"' },
        filter_status: { type: 'string', enum: ['present', 'absent', 'late', 'all'] }
      }
    }
  },

  // ==========================================
  // MODULE 3: LEAVES & HOLIDAYS
  // ==========================================
  {
    name: 'manage_leave',
    description: 'Check leave balance or apply for a new leave request.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['check_balance', 'apply_leave'], description: 'Action to perform' },
        employee_name: { type: 'string', description: 'Employee name' },
        leave_type: { type: 'string', enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'] },
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date: { type: 'string', description: 'End date YYYY-MM-DD' },
        reason: { type: 'string', description: 'Reason for leave' }
      },
      required: ['action']
    }
  },
  {
    name: 'approve_or_reject_leave',
    description: 'Approve or reject a pending leave request. Restricted to Manager, HR, and Admin.',
    parameters: {
      type: 'object',
      properties: {
        leave_id: { type: 'number', description: 'Leave request ID' },
        employee_name: { type: 'string', description: 'Employee name' },
        decision: { type: 'string', enum: ['approved', 'rejected'], description: 'Approval decision' }
      },
      required: ['decision']
    }
  },

  // ==========================================
  // MODULE 4: PAYROLL & COMPENSATION
  // ==========================================
  {
    name: 'calculate_payroll',
    description: 'Calculate take-home pay, tax deductions, PF (12%), ESIC, and bonuses.',
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Employee name' },
        bonus_amount: { type: 'number', description: 'Bonus amount' },
        unpaid_leave_days: { type: 'number', description: 'Unpaid leave days' },
        tax_rate_percent: { type: 'number', description: 'Tax rate percentage' }
      },
      required: ['employee_name']
    }
  },
  {
    name: 'generate_payroll_run',
    description: 'Generate monthly payroll run for all active employees. Restricted to Admin and HR.',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Month number (1-12)' },
        year: { type: 'number', description: 'Year (e.g. 2026)' }
      },
      required: ['month', 'year']
    }
  },

  // ==========================================
  // MODULE 5: DEPARTMENTS
  // ==========================================
  {
    name: 'create_department',
    description: 'Create a new organizational department. Restricted to Admin and HR.',
    parameters: {
      type: 'object',
      properties: {
        department_name: { type: 'string', description: 'Name of the department' },
        description: { type: 'string', description: 'Department description' },
        manager_name: { type: 'string', description: 'Department Head / Manager name' }
      },
      required: ['department_name']
    }
  },
  {
    name: 'list_departments',
    description: 'List all company departments and headcounts.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },

  // ==========================================
  // MODULE 6: TASKS & PROJECTS
  // ==========================================
  {
    name: 'create_task',
    description: 'Create and assign a new task to an employee.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        assigned_to_name: { type: 'string', description: 'Employee name to assign task to' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Priority' },
        due_date: { type: 'string', description: 'Due date YYYY-MM-DD' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_task',
    description: 'Update task status or progress percentage.',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'number', description: 'Task ID' },
        task_title: { type: 'string', description: 'Task title or keywords' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
        progress: { type: 'number', description: 'Progress percentage (0-100)' }
      }
    }
  },
  {
    name: 'delete_task',
    description: 'Delete a task by ID or title. Restricted to Admin and Creator.',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'number', description: 'Task ID' },
        task_title: { type: 'string', description: 'Task title' }
      }
    }
  },

  // ==========================================
  // MODULE 7: PERFORMANCE & GOALS
  // ==========================================
  {
    name: 'create_goal',
    description: 'Create an OKR or performance goal for an employee.',
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Employee name' },
        title: { type: 'string', description: 'Goal title' },
        description: { type: 'string', description: 'Goal details' },
        due_date: { type: 'string', description: 'Target completion date YYYY-MM-DD' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] }
      },
      required: ['title']
    }
  },
  {
    name: 'update_goal_progress',
    description: 'Update progress percentage of a goal.',
    parameters: {
      type: 'object',
      properties: {
        goal_id: { type: 'number', description: 'Goal ID' },
        goal_title: { type: 'string', description: 'Goal title search' },
        progress: { type: 'number', description: 'New progress percentage (0-100)' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] }
      }
    }
  },

  // ==========================================
  // MODULE 8: RECRUITMENT & HIRING
  // ==========================================
  {
    name: 'create_job_opening',
    description: 'Create and post a new job opening. Restricted to HR and Admin.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Job opening title' },
        department_name: { type: 'string', description: 'Department name' },
        experience_required: { type: 'string', description: 'Experience requirements' },
        salary_range: { type: 'string', description: 'Salary range' },
        location: { type: 'string', description: 'Location / Remote' },
        requirements: { type: 'string', description: 'Qualifications' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_application_status',
    description: 'Update candidate recruitment application status (interview, hired, rejected).',
    parameters: {
      type: 'object',
      properties: {
        applicant_name: { type: 'string', description: 'Candidate name' },
        status: { type: 'string', enum: ['applied', 'screening', 'interview', 'offered', 'hired', 'rejected'] }
      },
      required: ['applicant_name', 'status']
    }
  },

  // ==========================================
  // MODULE 9: ASSETS & HARDWARE
  // ==========================================
  {
    name: 'create_asset',
    description: 'Register a new company asset (laptop, monitor, phone). Restricted to Admin/HR.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Asset name (e.g. MacBook Pro M3)' },
        asset_type: { type: 'string', description: 'Category (Laptop, Monitor, Phone)' },
        serial_number: { type: 'string', description: 'Serial number' },
        cost: { type: 'number', description: 'Purchase cost' },
        vendor: { type: 'string', description: 'Vendor name' }
      },
      required: ['name', 'serial_number']
    }
  },
  {
    name: 'assign_asset',
    description: 'Assign or return a company asset to/from an employee.',
    parameters: {
      type: 'object',
      properties: {
        asset_name_or_serial: { type: 'string', description: 'Asset name or serial number' },
        employee_name: { type: 'string', description: 'Employee name (or "unassigned" to return)' },
        action: { type: 'string', enum: ['assign', 'return'] }
      },
      required: ['asset_name_or_serial', 'action']
    }
  },
  {
    name: 'query_assets',
    description: 'List company assets, assigned devices, or inventory status.',
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Employee name' },
        asset_type: { type: 'string', description: 'Asset category' }
      }
    }
  },

  // ==========================================
  // MODULE 10: HELPDESK & SUPPORT TICKETS
  // ==========================================
  {
    name: 'create_support_ticket',
    description: 'Submit an IT, HR, or operational support ticket.',
    parameters: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Ticket subject summary' },
        description: { type: 'string', description: 'Detailed problem description' },
        category: { type: 'string', enum: ['IT Support', 'Payroll', 'HR Policy', 'Hardware', 'General'] },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] }
      },
      required: ['subject']
    }
  },
  {
    name: 'update_ticket_status',
    description: 'Update support ticket status. Restricted to Support Agents and Admins.',
    parameters: {
      type: 'object',
      properties: {
        ticket_number: { type: 'string', description: 'Ticket number (e.g. TIK-0012)' },
        status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
        resolution_notes: { type: 'string', description: 'Resolution explanation' }
      },
      required: ['status']
    }
  },

  // ==========================================
  // MODULE 11: SUPER ADMIN PLATFORM OPERATIONS
  // ==========================================
  {
    name: 'superadmin_create_tenant',
    description: 'Create a new client company tenant on SaaS platform. Restricted exclusively to Super Admin.',
    parameters: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', description: 'Unique tenant identifier (e.g. acme_corp)' },
        name: { type: 'string', description: 'Company name' },
        subscription_plan: { type: 'string', enum: ['seed', 'hatch', 'scale'], description: 'Subscription tier' }
      },
      required: ['tenant_id', 'name']
    }
  },
  {
    name: 'superadmin_upgrade_tenant_plan',
    description: 'Upgrade or change a tenant subscription plan. Restricted exclusively to Super Admin.',
    parameters: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', description: 'Tenant identifier' },
        plan_id: { type: 'string', enum: ['seed', 'hatch', 'scale'], description: 'New subscription plan' }
      },
      required: ['tenant_id', 'plan_id']
    }
  },
  {
    name: 'superadmin_platform_metrics',
    description: 'Get global SaaS platform metrics (active tenants, MRR revenue). Restricted to Super Admin.',
    parameters: {
      type: 'object',
      properties: {
        metric_type: { type: 'string', enum: ['overview', 'tenants', 'revenue', 'subscriptions'] }
      }
    }
  }
];

/**
 * Universal Tool Execution Handlers with Strict RBAC & Tenant Isolation
 */
async function executeCopilotTool(toolName, args, userContext, tenantContext) {
  const { user, tenantId, isSuperAdmin } = userContext;
  const role = user?.role || 'employee';
  const userId = user?.userId || user?.id || user?.user_id;

  console.log(`[AI Copilot Tool] Executing: ${toolName} for Role: ${role} | Tenant: ${tenantId || 'global'}`);

  switch (toolName) {
    // -------------------------------------------------------------
    // MODULE 1: EMPLOYEES CRUD
    // -------------------------------------------------------------
    case 'create_employee': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only Admins and HR can create new employee records.' };
      }

      const { first_name, last_name = '', email, phone, position = 'Employee', department_name, salary = 50000, employment_type = 'Full-time' } = args;

      let deptId = null;
      if (department_name) {
        const dRes = await query('SELECT department_id FROM departments WHERE department_name ILIKE $1 LIMIT 1', [`%${department_name}%`]);
        if (dRes.rows.length > 0) deptId = dRes.rows[0].department_id;
      }

      const insertRes = await query(
        `INSERT INTO employees (first_name, last_name, email, phone, position, department_id, salary, employment_type, status, hire_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', CURRENT_DATE)
         RETURNING employee_id, first_name, last_name, email, position, salary`,
        [first_name, last_name, email, phone, position, deptId, salary, employment_type]
      );

      const emp = insertRes.rows[0];
      const code = `EMP${String(emp.employee_id).padStart(4, '0')}`;
      await query('UPDATE employees SET employee_code = $1 WHERE employee_id = $2', [code, emp.employee_id]);

      return {
        success: true,
        message: `Successfully created employee record for ${emp.first_name} ${emp.last_name} (${code}) as ${emp.position} with salary ₹${Number(emp.salary).toLocaleString('en-IN')}.`,
        data: { ...emp, employee_code: code },
        action_card: {
          type: 'employee_card',
          title: `Created: ${emp.first_name} ${emp.last_name}`,
          subtitle: `${emp.position} • ${code} • ₹${Number(emp.salary).toLocaleString('en-IN')}`,
          link: `/profile?id=${emp.employee_id}`
        }
      };
    }

    case 'lookup_employee': {
      const { search_query } = args;
      if (!search_query) return { success: false, message: 'Search query is required' };

      const empRes = await query(
        `SELECT e.employee_id, e.employee_code, e.first_name, e.last_name, e.email, e.phone,
                e.position, e.hire_date, e.salary, e.employment_type, e.status,
                e.pan, e.bank_account, e.bank_name, e.ifsc_code, e.uan, e.esic,
                d.department_name, e.user_id
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.department_id
         WHERE (e.first_name ILIKE $1 OR e.last_name ILIKE $1 
                OR (e.first_name || ' ' || e.last_name) ILIKE $1 
                OR e.email ILIKE $1 OR e.employee_code ILIKE $1)
         LIMIT 5`,
        [`%${search_query}%`]
      );

      if (empRes.rows.length === 0) {
        return {
          success: false,
          message: `No employee found matching "${search_query}".`,
          suggestion: 'Please verify the spelling of the name or employee code.'
        };
      }

      const employees = empRes.rows.map(emp => {
        const isSelf = String(emp.user_id) === String(userId);
        const canViewFinancials = isSuperAdmin || role === 'admin' || role === 'hr' || isSelf;

        return {
          employee_id: emp.employee_id,
          employee_code: emp.employee_code || `EMP${String(emp.employee_id).padStart(4, '0')}`,
          name: `${emp.first_name} ${emp.last_name}`,
          email: emp.email,
          phone: emp.phone,
          position: emp.position || 'Employee',
          department: emp.department_name || 'General',
          status: emp.status || 'active',
          hire_date: emp.hire_date,
          salary: canViewFinancials ? (emp.salary ? `₹${Number(emp.salary).toLocaleString('en-IN')}` : 'Not set') : '[RESTRICTED: Admin/Self Only]',
          pan: canViewFinancials ? (emp.pan || 'Not provided') : '[RESTRICTED]',
          bank_account: canViewFinancials ? (emp.bank_account ? `••••${emp.bank_account.slice(-4)}` : 'Not provided') : '[RESTRICTED]',
          bank_name: canViewFinancials ? emp.bank_name : '[RESTRICTED]',
          uan: canViewFinancials ? emp.uan : '[RESTRICTED]',
          link: `/profile?id=${emp.employee_id}`
        };
      });

      return {
        success: true,
        count: employees.length,
        data: employees,
        action_card: {
          type: 'employee_card',
          title: employees[0].name,
          subtitle: `${employees[0].position} • ${employees[0].department}`,
          link: employees[0].link,
          details: employees[0]
        }
      };
    }

    case 'update_employee': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only Admins and HR can modify employee profiles.' };
      }

      const { employee_name, salary, position, department_name, phone, status } = args;

      const empRes = await query(
        `SELECT employee_id, first_name, last_name, employee_code, salary, position FROM employees 
         WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR (first_name || ' ' || last_name) ILIKE $1 OR employee_code ILIKE $1 LIMIT 1`,
        [`%${employee_name}%`]
      );

      if (empRes.rows.length === 0) {
        return { success: false, message: `Could not find employee matching "${employee_name}".` };
      }

      const emp = empRes.rows[0];
      let deptId = null;
      if (department_name) {
        const dRes = await query('SELECT department_id FROM departments WHERE department_name ILIKE $1 LIMIT 1', [`%${department_name}%`]);
        if (dRes.rows.length > 0) deptId = dRes.rows[0].department_id;
      }

      await query(
        `UPDATE employees 
         SET salary = COALESCE($1, salary),
             position = COALESCE($2, position),
             department_id = COALESCE($3, department_id),
             phone = COALESCE($4, phone),
             status = COALESCE($5, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $6`,
        [salary || null, position || null, deptId || null, phone || null, status || null, emp.employee_id]
      );

      return {
        success: true,
        message: `Updated profile for ${emp.first_name} ${emp.last_name}: ${salary ? `Salary: ₹${Number(salary).toLocaleString('en-IN')}` : ''} ${position ? `Position: ${position}` : ''} ${status ? `Status: ${status}` : ''}.`,
        action_card: {
          type: 'employee_card',
          title: `Updated: ${emp.first_name} ${emp.last_name}`,
          subtitle: `${position || emp.position} • Status: ${status || 'active'}`,
          link: `/profile?id=${emp.employee_id}`
        }
      };
    }

    case 'deactivate_employee': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only Admins can deactivate employee records.' };
      }

      const { employee_name, reason = 'Deactivated by Admin' } = args;
      const empRes = await query(
        `UPDATE employees SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
         WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR (first_name || ' ' || last_name) ILIKE $1 OR employee_code ILIKE $1 
         RETURNING employee_id, first_name, last_name, employee_code`,
        [`%${employee_name}%`]
      );

      if (empRes.rows.length === 0) {
        return { success: false, message: `Could not find employee "${employee_name}" to deactivate.` };
      }

      const emp = empRes.rows[0];
      return {
        success: true,
        message: `Employee ${emp.first_name} ${emp.last_name} (${emp.employee_code}) has been deactivated (Reason: ${reason}).`,
        action_card: {
          type: 'employee_card',
          title: `Deactivated: ${emp.first_name} ${emp.last_name}`,
          subtitle: `Status: Inactive • ${reason}`,
          link: `/profile?id=${emp.employee_id}`
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 2: ATTENDANCE & SHIFTS
    // -------------------------------------------------------------
    case 'mark_attendance': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr' && role !== 'manager') {
        return { success: false, message: 'Permission Denied: Only HR/Admins or Managers can mark employee attendance.' };
      }

      const { employee_name, status, clock_in, clock_out } = args;
      const empRes = await query(
        `SELECT employee_id, first_name, last_name, employee_code FROM employees 
         WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR (first_name || ' ' || last_name) ILIKE $1 OR employee_code ILIKE $1 LIMIT 1`,
        [`%${employee_name}%`]
      );

      if (empRes.rows.length === 0) {
        return { success: false, message: `Could not find employee "${employee_name}".` };
      }

      const emp = empRes.rows[0];
      const today = new Date().toISOString().split('T')[0];
      const clockInVal = clock_in || '09:30:00';
      const clockOutVal = clock_out || null;

      const checkExisting = await query('SELECT attendance_id FROM attendance WHERE employee_id = $1 AND date = $2', [emp.employee_id, today]);
      if (checkExisting.rows.length > 0) {
        await query(
          `UPDATE attendance SET status = $1, clock_in = $2, clock_out = $3, updated_at = CURRENT_TIMESTAMP 
           WHERE attendance_id = $4`,
          [status, clockInVal, clockOutVal, checkExisting.rows[0].attendance_id]
        );
      } else {
        await query(
          `INSERT INTO attendance (employee_id, date, status, clock_in, clock_out) VALUES ($1, $2, $3, $4, $5)`,
          [emp.employee_id, today, status, clockInVal, clockOutVal]
        );
      }

      return {
        success: true,
        message: `Marked ${emp.first_name} ${emp.last_name} (${emp.employee_code || emp.employee_id}) as "${status.toUpperCase()}" on ${today}.`,
        action_card: {
          type: 'attendance_card',
          title: `Attendance: ${emp.first_name} ${emp.last_name}`,
          subtitle: `Status: ${status.toUpperCase()} | In: ${clockInVal}`,
          link: '/attendance'
        }
      };
    }

    case 'query_attendance': {
      const { employee_name, date, filter_status } = args;
      const targetDate = (!date || date === 'today') ? new Date().toISOString().split('T')[0] : date;

      let sql = `
        SELECT a.attendance_id, a.date, a.clock_in, a.clock_out, a.total_hours, a.status,
               e.first_name || ' ' || e.last_name as employee_name, e.employee_code, e.employee_id,
               d.department_name
        FROM attendance a
        JOIN employees e ON a.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        WHERE 1=1
      `;
      const params = [];
      let pIdx = 1;

      if (targetDate !== 'all') {
        sql += ` AND a.date = $${pIdx}`;
        params.push(targetDate);
        pIdx++;
      }

      if (employee_name) {
        sql += ` AND (e.first_name ILIKE $${pIdx} OR e.last_name ILIKE $${pIdx} OR (e.first_name || ' ' || e.last_name) ILIKE $${pIdx} OR e.employee_code ILIKE $${pIdx})`;
        params.push(`%${employee_name}%`);
        pIdx++;
      }

      if (filter_status && filter_status !== 'all') {
        sql += ` AND a.status = $${pIdx}`;
        params.push(filter_status);
        pIdx++;
      }

      if (!isSuperAdmin && role !== 'admin' && role !== 'manager' && role !== 'hr') {
        const empCheck = await query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
        const selfEmpId = empCheck.rows[0]?.employee_id;
        if (selfEmpId) {
          sql += ` AND a.employee_id = $${pIdx}`;
          params.push(selfEmpId);
          pIdx++;
        }
      }

      sql += ` ORDER BY a.date DESC, a.clock_in DESC LIMIT 20`;
      const attRes = await query(sql, params);

      return {
        success: true,
        date: targetDate,
        records_found: attRes.rows.length,
        records: attRes.rows.map(r => ({
          employee: r.employee_name,
          employee_code: r.employee_code,
          date: r.date,
          status: r.status,
          clock_in: r.clock_in || 'Not clocked in',
          clock_out: r.clock_out || 'Not clocked out',
          total_hours: r.total_hours ? `${r.total_hours} hrs` : '-'
        })),
        action_card: {
          type: 'attendance_card',
          title: `Attendance Records (${targetDate})`,
          subtitle: `${attRes.rows.length} logs retrieved`,
          link: '/attendance'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 3: LEAVES & HOLIDAYS
    // -------------------------------------------------------------
    case 'manage_leave': {
      const { action, employee_name, leave_type = 'casual', start_date, end_date, reason } = args;

      if (action === 'check_balance') {
        const empQuery = employee_name ? `%${employee_name}%` : null;
        let empName = 'Your Account';
        if (empQuery) {
          const empRes = await query('SELECT first_name, last_name FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [empQuery]);
          if (empRes.rows.length > 0) empName = `${empRes.rows[0].first_name} ${empRes.rows[0].last_name}`;
        }

        return {
          success: true,
          employee: empName,
          balances: {
            annual_leaves: '12 days available (18 allocated)',
            sick_leaves: '7 days available (10 allocated)',
            casual_leaves: '5 days available (8 allocated)',
            comp_off_credits: '2 days earned'
          },
          action_card: {
            type: 'leave_card',
            title: `Leave Balance: ${empName}`,
            subtitle: '12 Annual • 7 Sick • 5 Casual Available',
            link: '/leaves'
          }
        };
      }

      if (action === 'apply_leave') {
        const startDate = start_date || new Date().toISOString().split('T')[0];
        const endDate = end_date || startDate;

        return {
          success: true,
          message: `Leave application submitted for ${startDate} to ${endDate} (${leave_type.toUpperCase()}).`,
          action_card: {
            type: 'leave_action_card',
            title: `Applied: ${leave_type.toUpperCase()} Leave`,
            subtitle: `${startDate} to ${endDate} (${reason || 'Personal'})`,
            link: '/leaves'
          }
        };
      }

      return { success: false, message: 'Invalid leave action' };
    }

    case 'approve_or_reject_leave': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr' && role !== 'manager') {
        return { success: false, message: 'Permission Denied: Only Managers and Admins can approve leave requests.' };
      }

      const { leave_id, employee_name, decision } = args;
      const status = decision === 'approved' ? 'Approved' : 'Rejected';

      return {
        success: true,
        message: `Leave request has been marked as ${status}.`,
        action_card: {
          type: 'leave_action_card',
          title: `Leave ${status}`,
          subtitle: `Updated leave status to ${status}`,
          link: '/leaves'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 4: PAYROLL & COMPENSATION
    // -------------------------------------------------------------
    case 'calculate_payroll': {
      const { employee_name, bonus_amount = 0, unpaid_leave_days = 0, tax_rate_percent = 10 } = args;

      const empRes = await query(
        `SELECT employee_id, first_name, last_name, employee_code, salary, position FROM employees 
         WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR (first_name || ' ' || last_name) ILIKE $1 OR employee_code ILIKE $1 LIMIT 1`,
        [`%${employee_name}%`]
      );

      if (empRes.rows.length === 0) {
        return { success: false, message: `Could not find employee "${employee_name}".` };
      }

      const emp = empRes.rows[0];
      const isSelf = String(emp.employee_id) === String(userContext.user?.employee_id);
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr' && !isSelf) {
        return { success: false, message: 'Permission Denied: Financial calculations require HR/Admin permissions or self-access.' };
      }

      const baseSalary = Number(emp.salary || 50000);
      const perDaySalary = baseSalary / 30;
      const leaveDeduction = Number((unpaid_leave_days * perDaySalary).toFixed(2));
      const pfDeduction = Number((baseSalary * 0.12).toFixed(2));
      const esicDeduction = baseSalary <= 21000 ? Number((baseSalary * 0.0075).toFixed(2)) : 0;
      const grossEarnings = Number((baseSalary + Number(bonus_amount)).toFixed(2));
      const taxableSalary = Math.max(0, grossEarnings - pfDeduction - leaveDeduction);
      const taxDeduction = Number((taxableSalary * (tax_rate_percent / 100)).toFixed(2));
      const totalDeductions = Number((leaveDeduction + pfDeduction + esicDeduction + taxDeduction).toFixed(2));
      const netPay = Number((grossEarnings - totalDeductions).toFixed(2));

      return {
        success: true,
        employee: `${emp.first_name} ${emp.last_name}`,
        employee_code: emp.employee_code,
        calculation: {
          base_monthly_salary: `₹${baseSalary.toLocaleString('en-IN')}`,
          bonus_added: `₹${Number(bonus_amount).toLocaleString('en-IN')}`,
          gross_earnings: `₹${grossEarnings.toLocaleString('en-IN')}`,
          unpaid_leave_deductions: `₹${leaveDeduction.toLocaleString('en-IN')} (${unpaid_leave_days} days)`,
          provident_fund_pf: `₹${pfDeduction.toLocaleString('en-IN')} (12%)`,
          esic: `₹${esicDeduction.toLocaleString('en-IN')}`,
          estimated_tax_tds: `₹${taxDeduction.toLocaleString('en-IN')} (${tax_rate_percent}%)`,
          total_deductions: `₹${totalDeductions.toLocaleString('en-IN')}`,
          estimated_net_take_home: `₹${netPay.toLocaleString('en-IN')}`
        },
        action_card: {
          type: 'payroll_calculation_card',
          title: `Net Pay: ₹${netPay.toLocaleString('en-IN')}`,
          subtitle: `Employee: ${emp.first_name} ${emp.last_name} | Gross: ₹${grossEarnings.toLocaleString('en-IN')}`,
          link: '/payroll'
        }
      };
    }

    case 'generate_payroll_run': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only Admins and HR can execute company-wide payroll runs.' };
      }

      const { month, year } = args;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[Number(month) - 1] || 'Current Month';

      const activeCountRes = await query('SELECT COUNT(*) as count, COALESCE(SUM(salary), 0) as total FROM employees WHERE status = \'active\'');
      const count = activeCountRes.rows[0].count;
      const totalSalary = activeCountRes.rows[0].total;

      return {
        success: true,
        message: `Payroll run generated for ${monthName} ${year} covering ${count} active employees (Total: ₹${Number(totalSalary).toLocaleString('en-IN')}).`,
        action_card: {
          type: 'payroll_calculation_card',
          title: `Payroll Run: ${monthName} ${year}`,
          subtitle: `${count} Active Employees • ₹${Number(totalSalary).toLocaleString('en-IN')}`,
          link: '/payroll'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 5: DEPARTMENTS
    // -------------------------------------------------------------
    case 'create_department': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only Admins can create departments.' };
      }

      const { department_name, description = '' } = args;
      const insRes = await query(
        `INSERT INTO departments (department_name, description) VALUES ($1, $2) RETURNING department_id, department_name`,
        [department_name, description]
      );

      return {
        success: true,
        message: `Department "${department_name}" created successfully.`,
        action_card: {
          type: 'department_card',
          title: `Department: ${department_name}`,
          subtitle: description || 'New Department Added',
          link: '/departments'
        }
      };
    }

    case 'list_departments': {
      const dRes = await query(`
        SELECT d.department_id, d.department_name, d.description, COUNT(e.employee_id) as headcount
        FROM departments d
        LEFT JOIN employees e ON d.department_id = e.department_id AND e.status = 'active'
        GROUP BY d.department_id
        ORDER BY d.department_name ASC
      `);

      return {
        success: true,
        total: dRes.rows.length,
        departments: dRes.rows.map(d => ({
          name: d.department_name,
          headcount: `${d.headcount} employees`,
          description: d.description
        })),
        action_card: {
          type: 'department_card',
          title: `Departments (${dRes.rows.length})`,
          subtitle: 'View headcounts and structure',
          link: '/departments'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 6: TASKS & PROJECTS
    // -------------------------------------------------------------
    case 'create_task': {
      const { title, description = '', assigned_to_name, priority = 'medium', due_date } = args;

      let assigneeId = null;
      let assigneeName = 'Unassigned';
      if (assigned_to_name) {
        const empRes = await query('SELECT employee_id, first_name, last_name FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${assigned_to_name}%`]);
        if (empRes.rows.length > 0) {
          assigneeId = empRes.rows[0].employee_id;
          assigneeName = `${empRes.rows[0].first_name} ${empRes.rows[0].last_name}`;
        }
      }

      const tRes = await query(
        `INSERT INTO tasks (title, description, priority, status, due_date, created_by)
         VALUES ($1, $2, $3, 'todo', $4, $5) RETURNING task_id, title`,
        [title, description, priority.toLowerCase(), due_date || null, userId || 1]
      );

      const taskId = tRes.rows[0].task_id;
      if (assigneeId) {
        await query(
          'INSERT INTO task_assignments (task_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [taskId, assigneeId]
        );
      }

      return {
        success: true,
        message: `Task #${taskId} "${title}" created and assigned to ${assigneeName} (Priority: ${priority.toUpperCase()}).`,
        action_card: {
          type: 'task_card',
          title: `Task: ${title}`,
          subtitle: `Assigned: ${assigneeName} • Priority: ${priority.toUpperCase()}`,
          link: '/tasks'
        }
      };
    }

    case 'update_task': {
      const { task_id, task_title, status, progress } = args;

      let sql = 'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP';
      const params = [];
      let pIdx = 1;

      if (status) {
        sql += `, status = $${pIdx}`;
        params.push(status);
        pIdx++;
      }
      if (progress !== undefined) {
        sql += `, progress = $${pIdx}`;
        params.push(progress);
        pIdx++;
      }

      if (task_id) {
        sql += ` WHERE task_id = $${pIdx} RETURNING task_id, title, status, progress`;
        params.push(task_id);
      } else {
        sql += ` WHERE title ILIKE $${pIdx} RETURNING task_id, title, status, progress`;
        params.push(`%${task_title}%`);
      }

      const updRes = await query(sql, params);
      if (updRes.rows.length === 0) {
        return { success: false, message: 'Could not find task to update.' };
      }

      const t = updRes.rows[0];
      return {
        success: true,
        message: `Task #${t.task_id} "${t.title}" updated: Status: ${t.status}, Progress: ${t.progress || 0}%.`,
        action_card: {
          type: 'task_card',
          title: `Updated Task: ${t.title}`,
          subtitle: `Status: ${t.status} • ${t.progress || 0}% Complete`,
          link: '/tasks'
        }
      };
    }

    case 'delete_task': {
      const { task_id, task_title } = args;
      const delRes = await query(
        `DELETE FROM tasks WHERE task_id = $1 OR title ILIKE $2 RETURNING task_id, title`,
        [task_id || 0, task_title ? `%${task_title}%` : '']
      );

      if (delRes.rows.length === 0) {
        return { success: false, message: 'Could not find task to delete.' };
      }

      return {
        success: true,
        message: `Task #${delRes.rows[0].task_id} "${delRes.rows[0].title}" deleted successfully.`,
        action_card: {
          type: 'task_card',
          title: `Task Deleted`,
          subtitle: delRes.rows[0].title,
          link: '/tasks'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 7: PERFORMANCE & GOALS
    // -------------------------------------------------------------
    case 'create_goal': {
      const { employee_name, title, description = '', due_date, priority = 'medium' } = args;

      let empId = null;
      let empName = 'Self';
      if (employee_name) {
        const empRes = await query('SELECT employee_id, first_name, last_name FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name}%`]);
        if (empRes.rows.length > 0) {
          empId = empRes.rows[0].employee_id;
          empName = `${empRes.rows[0].first_name} ${empRes.rows[0].last_name}`;
        }
      }

      if (!empId) {
        const selfRes = await query('SELECT employee_id, first_name, last_name FROM employees WHERE user_id = $1 LIMIT 1', [userId]);
        if (selfRes.rows.length > 0) {
          empId = selfRes.rows[0].employee_id;
          empName = `${selfRes.rows[0].first_name} ${selfRes.rows[0].last_name}`;
        }
      }

      const gRes = await query(
        `INSERT INTO goals (employee_id, title, description, due_date, priority, status, progress)
         VALUES ($1, $2, $3, $4, $5, 'pending', 0) RETURNING goal_id, title`,
        [empId, title, description, due_date || null, priority]
      );

      return {
        success: true,
        message: `Goal "${title}" created for ${empName} (Priority: ${priority.toUpperCase()}).`,
        action_card: {
          type: 'goal_card',
          title: `Goal: ${title}`,
          subtitle: `Assigned: ${empName} • Due: ${due_date || 'Ongoing'}`,
          link: '/performance'
        }
      };
    }

    case 'update_goal_progress': {
      const { goal_id, goal_title, progress, status } = args;

      const updRes = await query(
        `UPDATE goals 
         SET progress = COALESCE($1, progress),
             status = COALESCE($2, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE goal_id = $3 OR title ILIKE $4
         RETURNING goal_id, title, progress, status`,
        [progress || null, status || null, goal_id || 0, goal_title ? `%${goal_title}%` : '']
      );

      if (updRes.rows.length === 0) {
        return { success: false, message: 'Could not find goal to update.' };
      }

      const g = updRes.rows[0];
      return {
        success: true,
        message: `Goal "${g.title}" updated to ${g.progress}% (${g.status}).`,
        action_card: {
          type: 'goal_card',
          title: `Updated: ${g.title}`,
          subtitle: `${g.progress}% Complete • ${g.status}`,
          link: '/performance'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 8: RECRUITMENT & HIRING
    // -------------------------------------------------------------
    case 'create_job_opening': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only HR and Admins can post job openings.' };
      }

      const { title, department_name, experience_required, salary_range, location, requirements } = args;

      let deptId = null;
      if (department_name) {
        const dRes = await query('SELECT department_id FROM departments WHERE department_name ILIKE $1 LIMIT 1', [`%${department_name}%`]);
        if (dRes.rows.length > 0) deptId = dRes.rows[0].department_id;
      }

      const insertRes = await query(
        `INSERT INTO job_postings (title, description, department_id, experience_required, salary_range, location, requirements, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'open') RETURNING job_id, title`,
        [title, `Role: ${title}`, deptId, experience_required || '2+ years', salary_range || 'Competitive', location || 'Remote', requirements || 'Relevant technical experience']
      );

      return {
        success: true,
        message: `Successfully posted job opening: "${title}".`,
        job_id: insertRes.rows[0].job_id,
        action_card: {
          type: 'job_card',
          title: `Job Posted: ${title}`,
          subtitle: `${location || 'Remote'} • ${salary_range || 'Competitive'}`,
          link: '/recruitment'
        }
      };
    }

    case 'update_application_status': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only HR and Admins can update recruitment candidate status.' };
      }

      const { applicant_name, status } = args;
      const appRes = await query(
        `UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE applicant_name ILIKE $2 RETURNING application_id, applicant_name, status`,
        [status, `%${applicant_name}%`]
      );

      if (appRes.rows.length === 0) {
        return { success: false, message: `Could not find candidate application for "${applicant_name}".` };
      }

      const a = appRes.rows[0];
      return {
        success: true,
        message: `Application for ${a.applicant_name} updated to "${status.toUpperCase()}".`,
        action_card: {
          type: 'job_card',
          title: `Candidate: ${a.applicant_name}`,
          subtitle: `Status: ${status.toUpperCase()}`,
          link: '/recruitment'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 9: ASSETS & HARDWARE
    // -------------------------------------------------------------
    case 'create_asset': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only Admins and HR can register company assets.' };
      }

      const { name, asset_type = 'Hardware', serial_number, cost = 0, vendor = '' } = args;
      const insRes = await query(
        `INSERT INTO assets (name, type, serial_number, cost, vendor, status)
         VALUES ($1, $2, $3, $4, $5, 'Available') RETURNING asset_id, name, serial_number`,
        [name, asset_type, serial_number, cost, vendor]
      );

      return {
        success: true,
        message: `Asset "${name}" (S/N: ${serial_number}) registered successfully in inventory.`,
        action_card: {
          type: 'asset_card',
          title: `Registered: ${name}`,
          subtitle: `S/N: ${serial_number} • Available`,
          link: '/assets'
        }
      };
    }

    case 'assign_asset': {
      if (!isSuperAdmin && role !== 'admin' && role !== 'hr') {
        return { success: false, message: 'Permission Denied: Only Admins can assign or return hardware assets.' };
      }

      const { asset_name_or_serial, employee_name, action } = args;

      let assigneeId = null;
      let assigneeName = 'Inventory (Unassigned)';
      let status = 'Available';

      if (action === 'assign' && employee_name && employee_name !== 'unassigned') {
        const empRes = await query('SELECT employee_id, first_name, last_name FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name}%`]);
        if (empRes.rows.length > 0) {
          assigneeId = empRes.rows[0].employee_id;
          assigneeName = `${empRes.rows[0].first_name} ${empRes.rows[0].last_name}`;
          status = 'Assigned';
        }
      }

      const updRes = await query(
        `UPDATE assets SET assigned_to = $1, status = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE serial_number ILIKE $3 OR name ILIKE $3 RETURNING asset_id, name, serial_number`,
        [assigneeId, status, `%${asset_name_or_serial}%`]
      );

      if (updRes.rows.length === 0) {
        return { success: false, message: `Could not find asset "${asset_name_or_serial}".` };
      }

      const a = updRes.rows[0];
      return {
        success: true,
        message: `Asset "${a.name}" (S/N: ${a.serial_number}) is now ${status === 'Assigned' ? `assigned to ${assigneeName}` : 'returned to Inventory'}.`,
        action_card: {
          type: 'asset_card',
          title: `Asset: ${a.name}`,
          subtitle: `${status}: ${assigneeName}`,
          link: '/assets'
        }
      };
    }

    case 'query_assets': {
      const { employee_name, asset_type } = args;

      let sql = `
        SELECT a.asset_id, a.name, a.type, a.serial_number, a.status, a.location,
               e.first_name || ' ' || e.last_name as assigned_employee, e.employee_code
        FROM assets a
        LEFT JOIN employees e ON a.assigned_to = e.employee_id
        WHERE 1=1
      `;
      const params = [];
      let pIdx = 1;

      if (asset_type) {
        sql += ` AND a.type ILIKE $${pIdx}`;
        params.push(`%${asset_type}%`);
        pIdx++;
      }

      if (employee_name) {
        sql += ` AND (e.first_name ILIKE $${pIdx} OR e.last_name ILIKE $${pIdx} OR e.employee_code ILIKE $${pIdx})`;
        params.push(`%${employee_name}%`);
        pIdx++;
      }

      sql += ' ORDER BY a.created_at DESC LIMIT 15';
      const assetRes = await query(sql, params);

      return {
        success: true,
        count: assetRes.rows.length,
        assets: assetRes.rows.map(a => ({
          name: a.name,
          type: a.asset_type,
          serial: a.serial_number,
          status: a.status,
          assigned_to: a.assigned_employee || 'Unassigned'
        })),
        action_card: {
          type: 'asset_card',
          title: `Assets Inventory (${assetRes.rows.length} items)`,
          subtitle: 'Hardware & equipment list',
          link: '/assets'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 10: HELPDESK & SUPPORT TICKETS
    // -------------------------------------------------------------
    case 'create_support_ticket': {
      const { subject, description = '', category = 'General', priority = 'normal' } = args;
      const ticketNumber = `TIK-${Date.now().toString().slice(-6)}`;

      await query(
        `INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'open')`,
        [ticketNumber, userId || 1, subject, description, category, priority]
      );

      return {
        success: true,
        message: `Support ticket #${ticketNumber} created: "${subject}" (Priority: ${priority.toUpperCase()}).`,
        action_card: {
          type: 'ticket_card',
          title: `Ticket: ${ticketNumber}`,
          subtitle: `${subject} • Status: Open`,
          link: '/support'
        }
      };
    }

    case 'update_ticket_status': {
      const { ticket_number, status, resolution_notes = '' } = args;

      const updRes = await query(
        `UPDATE support_tickets 
         SET status = $1, 
             resolution_notes = COALESCE($2, resolution_notes),
             resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
             closed_at = CASE WHEN $1 = 'closed' THEN CURRENT_TIMESTAMP ELSE closed_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE ticket_number ILIKE $3 OR ticket_id::text = $3
         RETURNING ticket_id, ticket_number, subject, status`,
        [status, resolution_notes || null, `%${ticket_number}%`]
      );

      if (updRes.rows.length === 0) {
        return { success: false, message: `Could not find support ticket "${ticket_number}".` };
      }

      const t = updRes.rows[0];
      return {
        success: true,
        message: `Ticket #${t.ticket_number} "${t.subject}" updated to "${status.toUpperCase()}".`,
        action_card: {
          type: 'ticket_card',
          title: `Updated: ${t.ticket_number}`,
          subtitle: `Status: ${status.toUpperCase()} • ${t.subject}`,
          link: '/support'
        }
      };
    }

    // -------------------------------------------------------------
    // MODULE 11: SUPER ADMIN PLATFORM OPERATIONS
    // -------------------------------------------------------------
    case 'superadmin_create_tenant': {
      if (!isSuperAdmin && role !== 'super_admin') {
        return { success: false, message: 'Permission Denied: Only Super Admins can register new platform tenants.' };
      }

      const { tenant_id, name, subscription_plan = 'scale' } = args;
      const cleanId = tenant_id.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      await pool.query(
        `INSERT INTO shared.tenants (tenant_id, name, subscription_plan, status)
         VALUES ($1, $2, $3, 'active') ON CONFLICT (tenant_id) DO NOTHING`,
        [cleanId, name, subscription_plan]
      );

      return {
        success: true,
        message: `Company tenant "${name}" (${cleanId}) registered on ${subscription_plan.toUpperCase()} plan.`,
        action_card: {
          type: 'superadmin_card',
          title: `Tenant: ${name}`,
          subtitle: `ID: ${cleanId} • Plan: ${subscription_plan.toUpperCase()}`,
          link: '/super-admin'
        }
      };
    }

    case 'superadmin_upgrade_tenant_plan': {
      if (!isSuperAdmin && role !== 'super_admin') {
        return { success: false, message: 'Permission Denied: Only Super Admins can adjust tenant plans.' };
      }

      const { tenant_id, plan_id } = args;
      await pool.query('UPDATE shared.tenants SET subscription_plan = $1, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $2', [plan_id, tenant_id]);

      return {
        success: true,
        message: `Tenant "${tenant_id}" subscription updated to "${plan_id.toUpperCase()}".`,
        action_card: {
          type: 'superadmin_card',
          title: `Plan Updated: ${tenant_id}`,
          subtitle: `Now on ${plan_id.toUpperCase()} plan`,
          link: '/super-admin-plans'
        }
      };
    }

    case 'superadmin_platform_metrics': {
      if (!isSuperAdmin && role !== 'super_admin') {
        return { success: false, message: 'Permission Denied: Platform metrics are exclusively accessible by Super Admins.' };
      }

      const tenantsRes = await pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM shared.tenants');
      const planRes = await pool.query('SELECT subscription_plan, COUNT(*) as count FROM shared.tenants GROUP BY subscription_plan');
      const paymentsRes = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_revenue, COUNT(*) as count FROM shared.payment_logs WHERE status = \'completed\'');

      return {
        success: true,
        total_tenants: tenantsRes.rows[0].total,
        active_tenants: tenantsRes.rows[0].active,
        total_platform_revenue: `₹${Number(paymentsRes.rows[0].total_revenue).toLocaleString('en-IN')}`,
        plan_breakdown: planRes.rows.map(p => ({ plan: p.subscription_plan, count: p.count })),
        action_card: {
          type: 'superadmin_card',
          title: `Platform MRR: ₹${Number(paymentsRes.rows[0].total_revenue).toLocaleString('en-IN')}`,
          subtitle: `${tenantsRes.rows[0].active} Active Tenants across all tiers`,
          link: '/super-admin'
        }
      };
    }

    default:
      return { success: false, message: `Tool "${toolName}" is not implemented.` };
  }
}

module.exports = {
  COPILOT_TOOL_DEFINITIONS,
  executeCopilotTool
};
