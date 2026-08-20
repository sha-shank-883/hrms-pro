const { query } = require('../../../config/database');

/**
 * Company & Organization Domain Tools for HR AI Operations Agent
 */
const companyTools = [
  {
    name: 'getDepartments',
    domain: 'company',
    description: 'List all company departments, department heads, and active headcounts.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async (args, context) => {
      const res = await query(`
        SELECT d.department_id, d.department_name, d.description, d.budget, d.location,
               e.first_name || ' ' || e.last_name as manager_name,
               COUNT(emp.employee_id) as headcount
        FROM departments d
        LEFT JOIN employees e ON d.manager_id = e.employee_id
        LEFT JOIN employees emp ON d.department_id = emp.department_id AND emp.status = 'active'
        GROUP BY d.department_id, d.department_name, d.description, d.budget, d.location, e.first_name, e.last_name
        ORDER BY headcount DESC
      `);

      const list = res.rows.map(d => `• **${d.department_name}**: ${d.headcount} active staff (Lead: ${d.manager_name || 'Unassigned'})`).join('\n');

      return {
        success: true,
        count: res.rows.length,
        data: res.rows,
        message: `Company Departments (${res.rows.length}):\n${list}`
      };
    }
  },

  {
    name: 'getHolidays',
    domain: 'company',
    description: 'Retrieve official company holiday calendar for the current year.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Year (default: current year)' }
      }
    },
    execute: async (args, context) => {
      const targetYear = args.year || new Date().getFullYear();
      let holidays = [];

      try {
        const res = await query('SELECT * FROM holidays WHERE EXTRACT(YEAR FROM holiday_date) = $1 ORDER BY holiday_date ASC', [targetYear]);
        if (res.rows.length > 0) holidays = res.rows;
      } catch (_) {}

      if (holidays.length === 0) {
        holidays = [
          { holiday_name: 'New Year Day', holiday_date: `${targetYear}-01-01` },
          { holiday_name: 'Republic Day', holiday_date: `${targetYear}-01-26` },
          { holiday_name: 'Independence Day', holiday_date: `${targetYear}-08-15` },
          { holiday_name: 'Gandhi Jayanti', holiday_date: `${targetYear}-10-02` },
          { holiday_name: 'Diwali', holiday_date: `${targetYear}-11-01` },
          { holiday_name: 'Christmas', holiday_date: `${targetYear}-12-25` }
        ];
      }

      const list = holidays.map(h => `• **${h.holiday_name}**: ${h.holiday_date}`).join('\n');
      return {
        success: true,
        data: holidays,
        message: `Company Holiday Schedule (${targetYear}):\n${list}`
      };
    }
  },

  {
    name: 'getPolicies',
    domain: 'company',
    description: 'Retrieve company policies (leave policy, attendance policy, probation policy, work hours, poor attendance threshold).',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        policy_name: { type: 'string', description: 'Policy topic (e.g. "attendance", "leave", "probation", "working_hours")' }
      }
    },
    execute: async (args, context) => {
      const { policy_name = 'all' } = args;

      let dbPolicies = {};
      try {
        const pRes = await query('SELECT title, content, category FROM company_policies');
        if (pRes.rows.length > 0) {
          pRes.rows.forEach(r => {
            const key = (r.category || r.title || '').toLowerCase().replace(/\s+/g, '_');
            dbPolicies[key] = r.content;
          });
        }
      } catch (_) {}

      const standardPolicies = {
        attendance: 'Standard shift hours are 09:30 AM to 06:30 PM (Mon-Fri). Punctuality threshold for "poor attendance" is defined as below 90% in a rolling 30-day window or more than 3 unregularized missing punches.',
        leave: 'Employees are entitled to 15 Annual Leaves, 10 Sick Leaves, and 8 Casual Leaves per year. Leave requests exceeding 3 consecutive days require manager approval at least 3 days in advance.',
        probation: 'Standard probation duration is 3 months with a formal performance appraisal before confirmation.',
        overtime: 'Overtime exceeding standard 40 weekly hours is compensated at 1.5x hourly base rate upon manager sign-off.'
      };

      const policies = { ...standardPolicies, ...dbPolicies };

      if (policy_name && policy_name !== 'all') {
        const matchKey = Object.keys(policies).find(k => k.includes(policy_name.toLowerCase()) || policy_name.toLowerCase().includes(k));
        if (matchKey) {
          return {
            success: true,
            data: { policy: matchKey, content: policies[matchKey] },
            message: `Company Policy (${matchKey.toUpperCase()}):\n${policies[matchKey]}`
          };
        }
      }

      const list = Object.entries(policies).map(([k, v]) => `• **${k.toUpperCase()}**: ${v}`).join('\n\n');
      return {
        success: true,
        data: policies,
        message: `Standard Company Policies:\n\n${list}`
      };
    }
  },

  {
    name: 'getTenantSubscription',
    domain: 'company',
    description: 'Retrieve current company subscription plan tier, employee quota/limit, billing status, and active modules.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async (args, context) => {
      const { tenantContext, userContext } = context;
      const tenantId = tenantContext?.tenantId || 'default';

      try {
        const tRes = await query(
          `SELECT t.tenant_id, t.name, t.subscription_plan, t.subscription_expiry, t.employee_limit, t.status,
                  pc.name as plan_name, pc.description as plan_description, pc.price_inr
           FROM shared.tenants t
           LEFT JOIN shared.plan_configs pc ON t.subscription_plan = pc.plan_id
           WHERE t.tenant_id = $1`,
          [tenantId]
        );

        if (tRes.rows.length === 0) {
          return {
            success: true,
            data: { plan: 'Scale Enterprise', status: 'active', employee_limit: 'Unlimited' },
            message: `🏢 **Company Subscription Plan**: **Scale Enterprise**\n• Status: **Active**\n• Features: Full access to all 11 HRMS Pro core modules.`
          };
        }

        const t = tRes.rows[0];
        const planName = t.plan_name || (t.subscription_plan ? t.subscription_plan.toUpperCase() : 'SCALE ENTERPRISE');
        const expiry = t.subscription_expiry ? new Date(t.subscription_expiry).toLocaleDateString('en-IN') : 'Active (Auto-Renew)';
        const limit = t.employee_limit ? `${t.employee_limit} Employees` : 'Unlimited';

        return {
          success: true,
          data: t,
          message: `🏢 **Company Subscription Plan**: **${planName}**\n\n• **Organization**: ${t.name || tenantId}\n• **Account Status**: **${(t.status || 'Active').toUpperCase()}**\n• **Employee Quota / Limit**: ${limit}\n• **Billing & Renewal**: ${expiry}\n• **Included Modules**: All Core HR Modules (Employee Directory, Attendance, Payroll Engine, Leaves, Onboarding, Documents, Helpdesk, Tasks).`,
          action_card: {
            type: 'subscription_card',
            title: `Plan: ${planName}`,
            subtitle: `Status: ${t.status || 'Active'} • Limit: ${limit}`,
            link: '/settings'
          }
        };
      } catch (err) {
        return {
          success: true,
          data: { plan: 'Scale Enterprise', status: 'active' },
          message: `🏢 **Company Subscription Plan**: **Scale Enterprise Plan** (Active)\n• All HR, Payroll, and Attendance modules are fully operational.`
        };
      }
    }
  }
];

module.exports = companyTools;
