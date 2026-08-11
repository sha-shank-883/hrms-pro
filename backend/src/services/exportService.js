const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, '../../uploads/exports');

const ensureDir = () => {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const exportPayslipsToCSV = async (filters = {}) => {
  ensureDir();
  const { run_id, month, year, payment_status } = filters;
  const filename = `payslips_export_${Date.now()}.csv`;
  const filePath = path.join(EXPORTS_DIR, filename);

  let sql = `
    SELECT ps.payslip_id, e.employee_id,
           e.first_name || ' ' || e.last_name as employee_name,
           d.department_name, e.position, r.period_month, r.period_year,
           ps.basic_salary, ps.gross_pay, ps.total_deductions, ps.net_pay,
           ps.payment_status, ps.payment_date, ps.payment_method, ps.generated_at
    FROM payslips ps
    JOIN employees e ON ps.employee_id = e.employee_id
    LEFT JOIN departments d ON e.department_id = d.department_id
    LEFT JOIN payroll_runs r ON ps.run_id = r.run_id
    WHERE 1=1`;
  const params = [];
  let paramIdx = 1;

  if (run_id) {
    sql += ` AND ps.run_id = $${paramIdx++}`;
    params.push(run_id);
  }
  if (month) {
    sql += ` AND r.period_month = $${paramIdx++}`;
    params.push(parseInt(month));
  }
  if (year) {
    sql += ` AND r.period_year = $${paramIdx++}`;
    params.push(parseInt(year));
  }
  if (payment_status) {
    sql += ` AND ps.payment_status = $${paramIdx++}`;
    params.push(payment_status);
  }
  sql += ' ORDER BY e.first_name, e.last_name';

  const result = await query(sql, params);

  const headers = [
    'Payslip ID', 'Employee ID', 'Employee Name', 'Department', 'Position',
    'Month', 'Year', 'Basic Salary', 'Gross Pay', 'Total Deductions',
    'Net Pay', 'Status', 'Payment Date', 'Payment Method', 'Generated At',
  ];

  const rows = result.rows.map(r => [
    r.payslip_id, r.employee_id, r.employee_name, r.department_name, r.position,
    r.period_month, r.period_year,
    parseFloat(r.basic_salary || 0).toFixed(2),
    parseFloat(r.gross_pay || 0).toFixed(2),
    parseFloat(r.total_deductions || 0).toFixed(2),
    parseFloat(r.net_pay || 0).toFixed(2),
    r.payment_status, r.payment_date, r.payment_method, r.generated_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');

  const bom = '\uFEFF';
  fs.writeFileSync(filePath, bom + csvContent, 'utf8');
  return filePath;
};

const exportPayrollRunsToCSV = async (filters = {}) => {
  ensureDir();
  const { status, year } = filters;
  const filename = `payroll_runs_export_${Date.now()}.csv`;
  const filePath = path.join(EXPORTS_DIR, filename);

  let sql = 'SELECT * FROM payroll_runs WHERE 1=1';
  const params = [];
  let paramIdx = 1;

  if (status) {
    sql += ` AND status = $${paramIdx++}`;
    params.push(status);
  }
  if (year) {
    sql += ` AND period_year = $${paramIdx++}`;
    params.push(parseInt(year));
  }
  sql += ' ORDER BY period_year DESC, period_month DESC';

  const result = await query(sql, params);

  const headers = [
    'Run ID', 'Period Month', 'Period Year', 'Status',
    'Total Employees', 'Total Gross', 'Total Deductions', 'Total Net',
    'Finalized At', 'Paid At', 'Created At',
  ];

  const rows = result.rows.map(r => [
    r.run_id, r.period_month, r.period_year, r.status,
    r.total_employees,
    parseFloat(r.total_gross || 0).toFixed(2),
    parseFloat(r.total_deductions || 0).toFixed(2),
    parseFloat(r.total_net || 0).toFixed(2),
    r.finalized_at, r.paid_at, r.created_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');

  const bom = '\uFEFF';
  fs.writeFileSync(filePath, bom + csvContent, 'utf8');
  return filePath;
};

const exportEarningsBreakdown = async (runId) => {
  ensureDir();
  const filename = `earnings_breakdown_${runId}_${Date.now()}.csv`;
  const filePath = path.join(EXPORTS_DIR, filename);

  const result = await query(
    `SELECT ps.payslip_id, e.employee_id, e.first_name || ' ' || e.last_name as employee_name,
            pe.component_name, pe.amount, pe.is_taxable
     FROM payslip_earnings pe
     JOIN payslips ps ON pe.payslip_id = ps.payslip_id
     JOIN employees e ON ps.employee_id = e.employee_id
     WHERE ps.run_id = $1
     ORDER BY e.first_name, pe.sort_order`,
    [runId]
  );

  const headers = ['Payslip ID', 'Employee ID', 'Employee Name', 'Component', 'Amount', 'Taxable'];
  const rows = result.rows.map(r => [
    r.payslip_id, r.employee_id, r.employee_name,
    r.component_name, parseFloat(r.amount || 0).toFixed(2),
    r.is_taxable ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');

  const bom = '\uFEFF';
  fs.writeFileSync(filePath, bom + csvContent, 'utf8');
  return filePath;
};

module.exports = {
  exportPayslipsToCSV,
  exportPayrollRunsToCSV,
  exportEarningsBreakdown,
};
