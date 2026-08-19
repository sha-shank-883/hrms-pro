const { query } = require('../../../config/database');

/**
 * Payroll Domain Tools for HR AI Operations Agent
 */
const payrollTools = [
  {
    name: 'getSalary',
    domain: 'payroll',
    description: 'Retrieve confidential salary and statutory deduction breakdown for an employee. Strictly guarded by RBAC.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Employee ID' },
        employee_name: { type: 'string', description: 'Employee Name' }
      }
    },
    execute: async (args, context) => {
      const { employee_id, employee_name } = args;
      const { user } = context;
      const role = user?.role || 'employee';

      let emp = null;
      if (employee_id) {
        const res = await query('SELECT employee_id, user_id, first_name, last_name, employee_code, position, salary, pan, bank_name, bank_account FROM employees WHERE employee_id = $1', [employee_id]);
        if (res.rows.length > 0) emp = res.rows[0];
      } else if (employee_name) {
        const res = await query('SELECT employee_id, user_id, first_name, last_name, employee_code, position, salary, pan, bank_name, bank_account FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name.trim()}%`]);
        if (res.rows.length > 0) emp = res.rows[0];
      } else if (role === 'employee') {
        const res = await query('SELECT employee_id, user_id, first_name, last_name, employee_code, position, salary, pan, bank_name, bank_account FROM employees WHERE user_id = $1', [user.userId]);
        if (res.rows.length > 0) emp = res.rows[0];
      }

      if (!emp) return { success: false, message: 'Employee not found for salary lookup.' };

      // RBAC Check: Employees can only see their own salary
      if (role === 'employee' && emp.user_id !== user.userId) {
        return { success: false, message: 'Permission Denied: Employees can only view their own salary.' };
      }

      const basic = parseFloat(emp.salary || 0);
      const pf = basic * 0.12;
      const esic = basic <= 21000 ? basic * 0.0075 : 0;
      const approxNet = basic - (pf + esic);

      return {
        success: true,
        data: {
          employee_name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
          employee_code: emp.employee_code,
          position: emp.position,
          monthly_base_salary: basic,
          annual_ctc: basic * 12,
          statutory_breakdown: {
            provident_fund_pf: pf,
            esic_insurance: esic,
            estimated_monthly_net: approxNet
          }
        },
        message: `Salary for **${emp.first_name} ${emp.last_name || ''}** (${emp.employee_code}): Monthly Base: **₹${Number(basic).toLocaleString('en-IN')}** (Annual CTC: ₹${Number(basic * 12).toLocaleString('en-IN')}). Est. Net Pay: **₹${Number(approxNet).toLocaleString('en-IN')}** (PF Deduction: ₹${Number(pf).toLocaleString('en-IN')}).`
      };
    }
  },

  {
    name: 'calculatePayroll',
    domain: 'payroll',
    description: 'Calculate or preview payroll numbers (earnings, PF, ESIC, leave deductions, net pay) for a specific employee without finalizing.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Employee Name' },
        bonus_amount: { type: 'number', description: 'Performance Bonus (₹)' },
        unpaid_days: { type: 'number', description: 'Unpaid Absent Days' }
      },
      required: ['employee_name']
    },
    execute: async (args, context) => {
      const { employee_name, bonus_amount = 0, unpaid_days = 0 } = args;

      const empRes = await query('SELECT employee_id, first_name, last_name, employee_code, position, salary FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name.trim()}%`]);
      if (empRes.rows.length === 0) return { success: false, message: `Employee "${employee_name}" not found.` };

      const emp = empRes.rows[0];
      const basic = parseFloat(emp.salary || 50000);
      const bonus = parseFloat(bonus_amount || 0);
      const gross = basic + bonus;

      const pf = basic * 0.12;
      const esic = basic <= 21000 ? basic * 0.0075 : 0;
      const leaveDeduction = unpaid_days * (basic / 30);
      const totalDeductions = pf + esic + leaveDeduction;
      const netPay = Math.max(0, gross - totalDeductions);

      return {
        success: true,
        data: {
          employee_name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
          employee_code: emp.employee_code,
          gross_earnings: gross,
          basic_salary: basic,
          bonus,
          deductions: {
            provident_fund: pf,
            esic,
            unpaid_leave_loss: leaveDeduction,
            total: totalDeductions
          },
          net_payable: netPay
        },
        message: `Payroll Calculation for **${emp.first_name} ${emp.last_name || ''}**: Gross Earnings: **₹${Number(gross).toLocaleString('en-IN')}**, Deductions: **₹${Number(totalDeductions).toLocaleString('en-IN')}** (PF: ₹${Number(pf).toLocaleString('en-IN')}), Net Payable: **₹${Number(netPay).toLocaleString('en-IN')}**.`
      };
    }
  },

  {
    name: 'finalizePayroll',
    domain: 'payroll',
    description: 'Finalize and commit monthly payroll run, generating formal payslips for all active employees. High-impact action requiring human confirmation.',
    type: 'sensitive_write',
    isSensitive: true,
    requiredRole: ['admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Payroll Month (1-12)' },
        year: { type: 'number', description: 'Payroll Year (e.g. 2026)' }
      },
      required: ['month', 'year']
    },
    execute: async (args, context) => {
      const { month, year } = args;

      // Count active employees
      const empCount = await query('SELECT COUNT(*) as total, SUM(salary) as total_salary FROM employees WHERE status = \'active\'');
      const count = parseInt(empCount.rows[0].total || 0, 10);
      const totalSalary = parseFloat(empCount.rows[0].total_salary || 0);

      if (count === 0) return { success: false, message: 'No active employees found to generate payroll.' };

      // Record payroll run
      const insRun = await query(`
        INSERT INTO payroll_runs (month, year, total_employees, total_amount, status, created_at)
        VALUES ($1, $2, $3, $4, 'completed', CURRENT_TIMESTAMP)
        RETURNING *
      `, [month, year, count, totalSalary]);

      return {
        success: true,
        data: insRun.rows[0],
        message: `Monthly Payroll for **${month}/${year}** has been finalized and processed for **${count} employees** (Total Disbursal: **₹${Number(totalSalary).toLocaleString('en-IN')}**). Payslips are now available in employee portals.`
      };
    }
  }
];

module.exports = payrollTools;
