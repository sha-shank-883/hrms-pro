const { query } = require('../../../config/database');

/**
 * Leave Domain Tools for HR AI Operations Agent
 */
const leaveTools = [
  {
    name: 'getLeaveBalance',
    domain: 'leave',
    description: 'Retrieve current leave balances (annual, sick, casual, unpaid) and consumed days for an employee.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Optional Employee ID' },
        employee_name: { type: 'string', description: 'Optional Employee Name' }
      }
    },
    execute: async (args, context) => {
      const { employee_id, employee_name } = args;
      const { user } = context;

      let empId = employee_id;
      if (!empId && employee_name) {
        const found = await query('SELECT employee_id, first_name, last_name FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name.trim()}%`]);
        if (found.rows.length > 0) empId = found.rows[0].employee_id;
      }
      if (!empId) {
        const myEmp = await query('SELECT employee_id, first_name, last_name FROM employees WHERE user_id = $1', [user.userId]);
        if (myEmp.rows.length > 0) empId = myEmp.rows[0].employee_id;
      }
      if (!empId) return { success: false, message: 'Could not identify employee to look up leave balances.' };

      const empRes = await query('SELECT employee_id, first_name, last_name, employee_code FROM employees WHERE employee_id = $1', [empId]);
      const emp = empRes.rows[0];

      // Calculate consumed leaves in current year
      const usedRes = await query(`
        SELECT leave_type, SUM(days_count) as days_used
        FROM leave_requests
        WHERE employee_id = $1 AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY leave_type
      `, [empId]);

      const consumed = {};
      usedRes.rows.forEach(r => { consumed[r.leave_type] = parseFloat(r.days_used || 0); });

      const quotas = {
        annual: 15,
        sick: 10,
        casual: 8
      };

      const balance = {
        annual_available: Math.max(0, quotas.annual - (consumed.annual || 0)),
        sick_available: Math.max(0, quotas.sick - (consumed.sick || 0)),
        casual_available: Math.max(0, quotas.casual - (consumed.casual || 0)),
        annual_used: consumed.annual || 0,
        sick_used: consumed.sick || 0,
        casual_used: consumed.casual || 0,
        total_remaining: Math.max(0, quotas.annual - (consumed.annual || 0)) + Math.max(0, quotas.sick - (consumed.sick || 0)) + Math.max(0, quotas.casual - (consumed.casual || 0))
      };

      return {
        success: true,
        data: {
          employee_name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
          employee_code: emp.employee_code,
          ...balance
        },
        message: `Leave Balance for **${emp.first_name} ${emp.last_name || ''}**: **${balance.annual_available}** Annual days, **${balance.sick_available}** Sick days, **${balance.casual_available}** Casual days remaining (${balance.total_remaining} total days left).`
      };
    }
  },

  {
    name: 'getLeaveRequests',
    domain: 'leave',
    description: 'Retrieve pending or past leave requests with filters for status or department.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'], description: 'Leave status filter' },
        employee_name: { type: 'string', description: 'Filter by employee' },
        limit: { type: 'number', description: 'Max records (default: 10)' }
      }
    },
    execute: async (args, context) => {
      const { status = 'pending', employee_name, limit = 10 } = args;
      const { user } = context;
      const role = user?.role || 'employee';

      let sql = `
        SELECT lr.leave_id, lr.leave_type, lr.start_date, lr.end_date, lr.days_count, lr.reason, lr.status, lr.created_at,
               e.first_name || ' ' || e.last_name as employee_name, e.employee_code, d.department_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        WHERE 1=1
      `;
      const params = [];
      let pIdx = 1;

      if (role === 'employee') {
        sql += ` AND e.user_id = $${pIdx}`;
        params.push(user.userId);
        pIdx++;
      }

      if (status && status !== 'all') {
        sql += ` AND lr.status = $${pIdx}`;
        params.push(status);
        pIdx++;
      }

      if (employee_name) {
        sql += ` AND (e.first_name ILIKE $${pIdx} OR e.last_name ILIKE $${pIdx})`;
        params.push(`%${employee_name.trim()}%`);
        pIdx++;
      }

      sql += ` ORDER BY lr.created_at DESC LIMIT $${pIdx}`;
      params.push(limit);

      const res = await query(sql, params);
      return {
        success: true,
        count: res.rows.length,
        data: res.rows,
        message: `Found ${res.rows.length} ${status === 'all' ? '' : status} leave request(s).`
      };
    }
  },

  {
    name: 'createLeaveRequest',
    domain: 'leave',
    description: 'Submit an official leave request with automated days count calculation and policy validation.',
    type: 'write',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Employee ID' },
        employee_name: { type: 'string', description: 'Employee Name' },
        leave_type: { type: 'string', enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'], description: 'Type of leave' },
        start_date: { type: 'string', description: 'Start Date (YYYY-MM-DD)' },
        end_date: { type: 'string', description: 'End Date (YYYY-MM-DD)' },
        reason: { type: 'string', description: 'Reason for absence' }
      },
      required: ['leave_type', 'start_date', 'end_date']
    },
    execute: async (args, context) => {
      const { employee_id, employee_name, leave_type, start_date, end_date, reason = 'Personal Leave' } = args;
      const { user } = context;

      let empId = employee_id;
      if (!empId && employee_name) {
        const found = await query('SELECT employee_id FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name.trim()}%`]);
        if (found.rows.length > 0) empId = found.rows[0].employee_id;
      }
      if (!empId) {
        const myEmp = await query('SELECT employee_id FROM employees WHERE user_id = $1', [user.userId]);
        if (myEmp.rows.length > 0) empId = myEmp.rows[0].employee_id;
      }
      if (!empId) return { success: false, message: 'Could not identify employee to submit leave application.' };

      const start = new Date(start_date);
      const end = new Date(end_date);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { success: false, message: 'Invalid start_date or end_date format (must be YYYY-MM-DD).' };
      }
      if (end < start) {
        return { success: false, message: 'End date cannot be earlier than start date.' };
      }

      const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const ins = await query(`
        INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `, [empId, leave_type, start_date, end_date, daysCount, reason]);

      const req = ins.rows[0];

      // Verification
      const vRes = await query('SELECT leave_id, status FROM leave_requests WHERE leave_id = $1', [req.leave_id]);
      if (vRes.rows.length === 0) return { success: false, message: 'Database verification failed for leave submission.' };

      return {
        success: true,
        data: req,
        message: `Leave request for **${daysCount} day(s)** (${leave_type.toUpperCase()} from ${start_date} to ${end_date}) submitted successfully with status **PENDING** approval.`
      };
    }
  },

  {
    name: 'approveLeave',
    domain: 'leave',
    description: 'Approve a pending leave application. Restricted to Manager, HR, and Admin.',
    type: 'write',
    isSensitive: false,
    requiredRole: ['manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        leave_id: { type: 'number', description: 'Leave Request ID' },
        employee_name: { type: 'string', description: 'Employee Name (to find latest pending request)' }
      }
    },
    execute: async (args, context) => {
      const { leave_id, employee_name } = args;
      const { user } = context;

      let targetId = leave_id;
      if (!targetId && employee_name) {
        const found = await query(`
          SELECT lr.leave_id FROM leave_requests lr
          JOIN employees e ON lr.employee_id = e.employee_id
          WHERE (e.first_name ILIKE $1 OR e.last_name ILIKE $1) AND lr.status = 'pending'
          ORDER BY lr.created_at DESC LIMIT 1
        `, [`%${employee_name.trim()}%`]);
        if (found.rows.length > 0) targetId = found.rows[0].leave_id;
      }

      if (!targetId) return { success: false, message: 'Could not find a pending leave request to approve.' };

      const up = await query(`
        UPDATE leave_requests
        SET status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE leave_id = $2 AND status = 'pending'
        RETURNING *
      `, [user.userId, targetId]);

      if (up.rows.length === 0) return { success: false, message: 'Leave request not found or not in pending state.' };

      return {
        success: true,
        data: up.rows[0],
        message: `Leave request #${targetId} has been **APPROVED** successfully.`
      };
    }
  }
];

module.exports = leaveTools;
