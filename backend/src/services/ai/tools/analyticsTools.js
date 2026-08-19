const { query } = require('../../../config/database');

/**
 * Analytics & HR Metrics Domain Tools for HR AI Operations Agent
 */
const analyticsTools = [
  {
    name: 'getHeadcount',
    domain: 'analytics',
    description: 'Get company headcount metrics breakdown by department, employment type, and active/inactive status.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async (args, context) => {
      const totalRes = await query(`
        SELECT COUNT(*) as total_employees,
               COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
               COUNT(CASE WHEN status = 'inactive' OR status = 'resigned' OR status = 'terminated' THEN 1 END) as inactive_count,
               COUNT(CASE WHEN employment_type = 'full-time' THEN 1 END) as full_time_count,
               COUNT(CASE WHEN employment_type = 'contract' THEN 1 END) as contract_count
        FROM employees
      `);

      const deptRes = await query(`
        SELECT d.department_name, COUNT(e.employee_id) as count
        FROM departments d
        LEFT JOIN employees e ON d.department_id = e.department_id AND e.status = 'active'
        GROUP BY d.department_name
        ORDER BY count DESC
      `);

      const metrics = totalRes.rows[0];
      const deptBreakdown = deptRes.rows.map(d => `• **${d.department_name}**: ${d.count} staff`).join('\n');

      return {
        success: true,
        data: {
          total: parseInt(metrics.total_employees, 10),
          active: parseInt(metrics.active_count, 10),
          inactive: parseInt(metrics.inactive_count, 10),
          full_time: parseInt(metrics.full_time_count, 10),
          contract: parseInt(metrics.contract_count, 10),
          departments: deptRes.rows
        },
        message: `Headcount Overview:\n• **Total Headcount**: **${metrics.total_employees}** (Active: **${metrics.active_count}**, Inactive: **${metrics.inactive_count}**)\n• **Full-Time**: ${metrics.full_time_count} | **Contractors**: ${metrics.contract_count}\n\n**Department Distribution:**\n${deptBreakdown}`
      };
    }
  },

  {
    name: 'getPayrollCostAnalysis',
    domain: 'analytics',
    description: 'Analyze company payroll expenditures, month-over-month cost drivers (new hires, salary revisions, department shares).',
    type: 'read',
    isSensitive: false,
    requiredRole: ['admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Month (1-12)' },
        year: { type: 'number', description: 'Year' }
      }
    },
    execute: async (args, context) => {
      const res = await query(`
        SELECT d.department_name, SUM(e.salary) as department_salary_total, COUNT(e.employee_id) as headcount
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.department_id
        WHERE e.status = 'active'
        GROUP BY d.department_name
        ORDER BY department_salary_total DESC
      `);

      const totalMonthly = res.rows.reduce((sum, r) => sum + parseFloat(r.department_salary_total || 0), 0);
      const list = res.rows.map(r => `• **${r.department_name || 'Unassigned'}**: ₹${Number(r.department_salary_total || 0).toLocaleString('en-IN')} (${r.headcount} staff)`).join('\n');

      return {
        success: true,
        data: {
          total_monthly_payroll: totalMonthly,
          annualized_payroll: totalMonthly * 12,
          department_breakdown: res.rows
        },
        message: `Total Active Monthly Payroll: **₹${Number(totalMonthly).toLocaleString('en-IN')}** (Annualized: **₹${Number(totalMonthly * 12).toLocaleString('en-IN')}**).\n\n**Department Payroll Distribution:**\n${list}`
      };
    }
  }
];

module.exports = analyticsTools;
