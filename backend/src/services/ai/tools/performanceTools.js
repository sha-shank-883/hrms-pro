const { query } = require('../../../config/database');

/**
 * Performance & Goals Domain Tools for HR AI Operations Agent
 */
const performanceTools = [
  {
    name: 'getGoals',
    domain: 'performance',
    description: 'Retrieve OKRs, performance goals, and key results progress for an employee or company.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Filter by employee' },
        status: { type: 'string', enum: ['in_progress', 'completed', 'pending', 'all'] }
      }
    },
    execute: async (args, context) => {
      const { employee_name, status = 'all' } = args;
      const { user } = context;
      const role = user?.role || 'employee';

      let sql = `
        SELECT g.goal_id, g.title, g.description, g.category, g.priority, g.progress, g.due_date, g.status,
               e.first_name || ' ' || e.last_name as employee_name, e.employee_code
        FROM goals g
        JOIN employees e ON g.employee_id = e.employee_id
        WHERE 1=1
      `;
      const params = [];
      let pIdx = 1;

      if (role === 'employee') {
        sql += ` AND e.user_id = $${pIdx}`;
        params.push(user.userId);
        pIdx++;
      } else if (employee_name) {
        sql += ` AND (e.first_name ILIKE $${pIdx} OR e.last_name ILIKE $${pIdx})`;
        params.push(`%${employee_name.trim()}%`);
        pIdx++;
      }

      if (status && status !== 'all') {
        sql += ` AND g.status = $${pIdx}`;
        params.push(status);
        pIdx++;
      }

      sql += ` ORDER BY g.created_at DESC LIMIT 15`;

      const res = await query(sql, params);
      const list = res.rows.map(g => `• **${g.title}** (${g.employee_name}) — Progress: **${g.progress}%** [${g.status}]`).join('\n');

      return {
        success: true,
        count: res.rows.length,
        data: res.rows,
        message: res.rows.length > 0 ? `Performance Goals & OKRs (${res.rows.length}):\n${list}` : 'No performance goals found for the specified criteria.'
      };
    }
  },

  {
    name: 'createGoal',
    domain: 'performance',
    description: 'Create a new OKR / Goal for an employee with priority and target deadline.',
    type: 'write',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Goal Title / Objective (Mandatory)' },
        employee_name: { type: 'string', description: 'Employee Name' },
        category: { type: 'string', description: 'Category (e.g. Technical, Operational, Sales)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        due_date: { type: 'string', description: 'Due Date YYYY-MM-DD' }
      },
      required: ['title']
    },
    execute: async (args, context) => {
      const { title, employee_name, category = 'General', priority = 'medium', due_date = null } = args;
      const { user } = context;

      let empId = null;
      if (employee_name) {
        const found = await query('SELECT employee_id FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name.trim()}%`]);
        if (found.rows.length > 0) empId = found.rows[0].employee_id;
      }
      if (!empId) {
        const myEmp = await query('SELECT employee_id FROM employees WHERE user_id = $1', [user.userId]);
        if (myEmp.rows.length > 0) empId = myEmp.rows[0].employee_id;
      }
      if (!empId) return { success: false, message: 'Could not resolve target employee for goal creation.' };

      const ins = await query(`
        INSERT INTO goals (employee_id, title, category, priority, progress, due_date, status)
        VALUES ($1, $2, $3, $4, 0, $5, 'in_progress')
        RETURNING *
      `, [empId, title.trim(), category, priority, due_date]);

      return {
        success: true,
        data: ins.rows[0],
        message: `Goal **"${title}"** has been created with priority **${priority.toUpperCase()}** and status **IN PROGRESS (0%)**.`
      };
    }
  }
];

module.exports = performanceTools;
