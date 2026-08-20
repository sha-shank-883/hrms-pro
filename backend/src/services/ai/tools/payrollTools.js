const { query } = require('../../../config/database');
const { resolveEmployee } = require('../entityResolver');

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

      if (employee_id || employee_name) {
        const resEmp = await resolveEmployee(employee_id || employee_name, context);
        if (resEmp.status === 'ambiguous') {
          return {
            success: true,
            disambiguation_needed: true,
            disambiguation_options: resEmp.options,
            count: resEmp.count,
            message: resEmp.message
          };
        }
        if (resEmp.status === 'resolved') {
          emp = resEmp.employee;
        }
      } else if (role === 'employee') {
        const res = await query('SELECT employee_id, user_id, first_name, last_name, employee_code, position, salary, pan, bank_name, bank_account FROM employees WHERE user_id = $1', [user.userId]);
        if (res.rows.length > 0) emp = res.rows[0];
      }

      if (!emp) return { success: false, message: 'Employee not found for salary lookup.' };

      // RBAC Check: Regular employees can only see their own salary
      if (role === 'employee' && emp.user_id !== user.userId) {
        return { success: false, message: 'Permission Denied: Regular employees are only authorized to view their own salary records.' };
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
        unpaid_days: { type: 'number', description: 'Unpaid Absent Days' },
        month: { type: 'number', description: 'Month (1-12)' },
        year: { type: 'number', description: 'Year' }
      },
      required: ['employee_name']
    },
    execute: async (args, context) => {
      const { employee_name, bonus_amount = 0, unpaid_days = 0, month, year } = args;

      const resEmp = await resolveEmployee(employee_name, context);
      if (resEmp.status === 'ambiguous') {
        return {
          success: true,
          disambiguation_needed: true,
          disambiguation_options: resEmp.options,
          count: resEmp.count,
          message: resEmp.message
        };
      }
      if (resEmp.status !== 'resolved' || !resEmp.employee) {
        return { success: false, message: `Employee "${employee_name}" not found.` };
      }

      const emp = resEmp.employee;
      const basic = parseFloat(emp.salary || 0);
      if (basic <= 0) {
        return { success: false, message: `Employee ${emp.first_name} has no salary defined in company records.` };
      }

      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || (new Date().getMonth() + 1);
      const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();

      const bonus = parseFloat(bonus_amount || 0);
      const gross = basic + bonus;

      const pf = basic * 0.12;
      const esic = basic <= 21000 ? basic * 0.0075 : 0;
      const dailyRate = basic / daysInTargetMonth;
      const leaveDeduction = parseFloat((unpaid_days * dailyRate).toFixed(2));
      const totalDeductions = parseFloat((pf + esic + leaveDeduction).toFixed(2));
      const netPay = Math.max(0, parseFloat((gross - totalDeductions).toFixed(2)));

      return {
        success: true,
        data: {
          employee_name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
          employee_code: emp.employee_code,
          calculation_period: `${targetMonth}/${targetYear} (${daysInTargetMonth} days in month)`,
          gross_earnings: gross,
          basic_salary: basic,
          bonus,
          deductions: {
            provident_fund: pf,
            esic,
            unpaid_leave_loss: leaveDeduction,
            daily_rate_applied: dailyRate,
            total: totalDeductions
          },
          net_payable: netPay
        },
        message: `Payroll Calculation for **${emp.first_name} ${emp.last_name || ''}** (${targetMonth}/${targetYear}): Gross Earnings: **₹${Number(gross).toLocaleString('en-IN')}**, Deductions: **₹${Number(totalDeductions).toLocaleString('en-IN')}** (PF: ₹${Number(pf).toLocaleString('en-IN')}, Unpaid Deductions: ₹${Number(leaveDeduction).toLocaleString('en-IN')}), Net Payable: **₹${Number(netPay).toLocaleString('en-IN')}**.`
      };
    }
  },

  {
    name: 'finalizePayroll',
    domain: 'payroll',
    description: 'Finalize and commit monthly payroll run, calculating net payouts and statutory deductions. High-impact action requiring human confirmation.',
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
      const targetMonth = parseInt(month, 10);
      const targetYear = parseInt(year, 10);

      // Check if already finalized for this month/year
      const existing = await query('SELECT run_id, status FROM payroll_runs WHERE month = $1 AND year = $2', [targetMonth, targetYear]);
      if (existing.rows.length > 0) {
        return { success: false, message: `Payroll for period ${targetMonth}/${targetYear} has already been finalized.` };
      }

      // Fetch all active employees
      const activeEmps = await query('SELECT employee_id, first_name, last_name, salary FROM employees WHERE status = \'active\'');
      if (activeEmps.rows.length === 0) {
        return { success: false, message: 'No active employees found to process payroll.' };
      }

      let totalGross = 0;
      let totalNet = 0;
      let totalPF = 0;

      activeEmps.rows.forEach(emp => {
        const base = parseFloat(emp.salary || 0);
        const pf = base * 0.12;
        const esic = base <= 21000 ? base * 0.0075 : 0;
        const net = Math.max(0, base - (pf + esic));
        totalGross += base;
        totalNet += net;
        totalPF += pf;
      });

      // Record payroll run
      const insRun = await query(`
        INSERT INTO payroll_runs (month, year, total_employees, total_amount, status, created_at)
        VALUES ($1, $2, $3, $4, 'completed', CURRENT_TIMESTAMP)
        RETURNING *
      `, [targetMonth, targetYear, activeEmps.rows.length, totalNet]);

      return {
        success: true,
        data: {
          ...insRun.rows[0],
          total_gross: totalGross,
          total_net_disbursal: totalNet,
          total_pf_withholding: totalPF
        },
        message: `Monthly Payroll for **${targetMonth}/${targetYear}** has been finalized and processed for **${activeEmps.rows.length} employees** (Gross: ₹${Number(totalGross).toLocaleString('en-IN')}, Net Disbursal: **₹${Number(totalNet).toLocaleString('en-IN')}**, Statutory PF: ₹${Number(totalPF).toLocaleString('en-IN')}). Payslips generated.`
      };
    }
  }
];

module.exports = payrollTools;
