const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError, ForbiddenError } = require('../utils/errors');
const payslipEngine = require('../services/payslipEngine');
const pdfService = require('../services/pdfService');

const getCompanySettings = async () => {
  const keys = ['company_name', 'company_address', 'company_email', 'company_phone', 'company_logo_url', 'currency_symbol', 'currency', 'company_website'];
  const vals = {};
  for (const key of keys) {
    const r = await query('SELECT setting_value FROM settings WHERE setting_key = $1', [key]);
    vals[key] = r.rows[0]?.setting_value || '';
  }
  return vals;
};

const getDefaultTemplate = async () => {
  const r = await query("SELECT * FROM payslip_templates WHERE is_default = TRUE AND is_active = TRUE LIMIT 1");
  return r.rows[0] || null;
};

const generatePayslip = asyncHandler(async (req, res) => {
  const { run_id, employee_id, month, year } = req.body;

  if (!employee_id || !month || !year) {
    throw new ValidationError('Employee ID, month, and year are required');
  }

  const existingPayslip = run_id
    ? await query('SELECT * FROM payslips WHERE run_id = $1 AND employee_id = $2', [run_id, employee_id])
    : await query('SELECT * FROM payslips ps JOIN payroll_runs r ON ps.run_id = r.run_id WHERE ps.employee_id = $1 AND r.period_month = $2 AND r.period_year = $3 AND r.status = \'draft\'', [employee_id, month, year]);

  if (existingPayslip.rows.length > 0) {
    throw new ConflictError('Payslip already exists for this employee and period');
  }

  const payslipData = await payslipEngine.generatePayslipData(employee_id, month, year);

  let runId = run_id;
  if (!runId) {
    let run = await query(
      'SELECT * FROM payroll_runs WHERE period_month = $1 AND period_year = $2 AND status = $3',
      [month, year, 'draft']
    );
    if (run.rows.length === 0) {
      const newRun = await query(
        `INSERT INTO payroll_runs (period_month, period_year, status, generated_by)
         VALUES ($1, $2, 'draft', $3) RETURNING *`,
        [month, year, req.user.userId]
      );
      runId = newRun.rows[0].run_id;
    } else {
      runId = run.rows[0].run_id;
    }
  }

  let existingPayrollRecord = await query(
    'SELECT payroll_id FROM payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
    [employee_id, month, year]
  );
  let payrollRecordId = existingPayrollRecord.rows[0]?.payroll_id || null;

  const [companySettings, defaultTemplate, employeeRecord] = await Promise.all([
    getCompanySettings(),
    getDefaultTemplate(),
    query('SELECT employee_code, pan, bank_account, uan, esic FROM employees WHERE employee_id = $1', [employee_id]),
  ]);

  const emp = employeeRecord.rows[0] || {};
  const pdfOptions = {
    template: defaultTemplate,
    companyName: companySettings.company_name,
    companyAddress: companySettings.company_address,
    companyEmail: companySettings.company_email,
    companyPhone: companySettings.company_phone,
    companyLogoUrl: companySettings.company_logo_url,
    currencySymbol: companySettings.currency_symbol || '$',
    employeeCode: emp.employee_code,
    pan: emp.pan,
    bankAccount: emp.bank_account,
    uan: emp.uan,
    esic: emp.esic,
  };

  const pdfPath = await pdfService.generatePayslipPDF(payslipData, pdfOptions);

  const totalEarnings = payslipData.earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = payslipData.deductions.reduce((sum, d) => sum + d.amount, 0);

  const payslipResult = await query(
    `INSERT INTO payslips (run_id, employee_id, payroll_record_id, basic_salary, gross_pay,
      total_deductions, net_pay, payment_status, pdf_path, notes, generated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, CURRENT_TIMESTAMP)
     RETURNING *`,
    [runId, employee_id, payrollRecordId, payslipData.basicSalary,
     payslipData.grossPay, payslipData.totalDeductions, payslipData.netPay,
     pdfPath, `Auto-generated. Period: ${month}/${year}`]
  );

  const payslipId = payslipResult.rows[0].payslip_id;

  for (const item of payslipData.earnings) {
    await query(
      `INSERT INTO payslip_earnings (payslip_id, component_name, amount, is_taxable, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [payslipId, item.component_name, item.amount, item.is_taxable, item.sort_order]
    );
  }

  for (const item of payslipData.deductions) {
    await query(
      `INSERT INTO payslip_deductions (payslip_id, component_name, amount, is_mandatory, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [payslipId, item.component_name, item.amount, item.is_mandatory, item.sort_order]
    );
  }

  await query(
    `UPDATE payroll_runs SET total_employees = (SELECT COUNT(*) FROM payslips WHERE run_id = $1),
     total_gross = (SELECT COALESCE(SUM(gross_pay), 0) FROM payslips WHERE run_id = $1),
     total_deductions = (SELECT COALESCE(SUM(total_deductions), 0) FROM payslips WHERE run_id = $1),
     total_net = (SELECT COALESCE(SUM(net_pay), 0) FROM payslips WHERE run_id = $1),
     updated_at = CURRENT_TIMESTAMP WHERE run_id = $1`,
    [runId]
  );

  res.status(201).json({
    success: true,
    message: 'Payslip generated successfully',
    data: payslipResult.rows[0],
  });
});

const generateBulkPayslips = asyncHandler(async (req, res) => {
  const { run_id, month, year } = req.body;

  if (!month || !year) {
    throw new ValidationError('Month and year are required');
  }

  const employeesResult = await query(
    'SELECT employee_id, first_name, last_name, employee_code, pan, bank_account, uan, esic FROM employees'
  );

  if (employeesResult.rows.length === 0) {
    throw new NotFoundError('No employees found');
  }

  let runId = run_id;
  if (!runId) {
    let run = await query(
      'SELECT * FROM payroll_runs WHERE period_month = $1 AND period_year = $2 AND status = $3',
      [month, year, 'draft']
    );
    if (run.rows.length === 0) {
      const newRun = await query(
        `INSERT INTO payroll_runs (period_month, period_year, status, generated_by)
         VALUES ($1, $2, 'draft', $3) RETURNING *`,
        [month, year, req.user.userId]
      );
      runId = newRun.rows[0].run_id;
    } else {
      runId = run.rows[0].run_id;
    }
  }

  const [companySettings, defaultTemplate] = await Promise.all([
    getCompanySettings(),
    getDefaultTemplate(),
  ]);

  const pdfOptions = {
    template: defaultTemplate,
    companyName: companySettings.company_name,
    companyAddress: companySettings.company_address,
    companyEmail: companySettings.company_email,
    companyPhone: companySettings.company_phone,
    companyLogoUrl: companySettings.company_logo_url,
    currencySymbol: companySettings.currency_symbol || '$',
  };

  const results = [];
  const errors = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  for (const emp of employeesResult.rows) {
    try {
      const existingPayslip = await query(
        'SELECT * FROM payslips WHERE run_id = $1 AND employee_id = $2',
        [runId, emp.employee_id]
      );
      if (existingPayslip.rows.length > 0) {
        results.push({ employee_id: emp.employee_id, status: 'skipped', message: 'Payslip already exists' });
        continue;
      }

      const payslipData = await payslipEngine.generatePayslipData(emp.employee_id, month, year);

      let existingPayrollRecord = await query(
        'SELECT payroll_id FROM payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
        [emp.employee_id, month, year]
      );
      const payrollRecordId = existingPayrollRecord.rows[0]?.payroll_id || null;

      const empPdfOptions = {
        ...pdfOptions,
        employeeCode: emp.employee_code,
        pan: emp.pan,
        bankAccount: emp.bank_account,
        uan: emp.uan,
        esic: emp.esic,
      };
      const pdfPath = await pdfService.generatePayslipPDF(payslipData, empPdfOptions);

      const totalEarnings = payslipData.earnings.reduce((sum, e) => sum + e.amount, 0);
      const totalDeductions = payslipData.deductions.reduce((sum, d) => sum + d.amount, 0);

      const payslipResult = await query(
        `INSERT INTO payslips (run_id, employee_id, payroll_record_id, basic_salary, gross_pay,
          total_deductions, net_pay, pdf_path, notes, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, CURRENT_TIMESTAMP)
         RETURNING *`,
        [runId, emp.employee_id, payrollRecordId, payslipData.basicSalary,
         payslipData.grossPay, payslipData.totalDeductions, payslipData.netPay,
         pdfPath, `Auto-generated. Period: ${month}/${year}`]
      );

      const payslipId = payslipResult.rows[0].payslip_id;

      for (const item of payslipData.earnings) {
        await query(
          `INSERT INTO payslip_earnings (payslip_id, component_name, amount, is_taxable, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [payslipId, item.component_name, item.amount, item.is_taxable, item.sort_order]
        );
      }

      for (const item of payslipData.deductions) {
        await query(
          `INSERT INTO payslip_deductions (payslip_id, component_name, amount, is_mandatory, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [payslipId, item.component_name, item.amount, item.is_mandatory, item.sort_order]
        );
      }

      totalGross += payslipData.grossPay || 0;
      totalDeductions += payslipData.totalDeductions || 0;
      totalNet += payslipData.netPay || 0;

      results.push({ employee_id: emp.employee_id, status: 'success' });
    } catch (err) {
      errors.push({ employee_id: emp.employee_id, error: err.message });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  await query(
    `UPDATE payroll_runs SET total_employees = $1,
     total_gross = $2, total_deductions = $3, total_net = $4,
     updated_at = CURRENT_TIMESTAMP WHERE run_id = $5`,
    [successCount + skippedCount, totalGross, totalDeductions, totalNet, runId]
  );

  res.json({
    success: true,
    message: `Bulk generation: ${successCount} created, ${skippedCount} skipped, ${errors.length} errors`,
    data: { run_id: runId, results, errors },
  });
});

const listPayslips = asyncHandler(async (req, res) => {
  const { run_id, employee_id, payment_status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;
  const params = [];
  let paramIdx = 1;

  let sql = `SELECT ps.*, e.first_name || ' ' || e.last_name as employee_name, d.department_name
    FROM payslips ps JOIN employees e ON ps.employee_id = e.employee_id
    LEFT JOIN departments d ON e.department_id = d.department_id WHERE 1=1`;
  let countSql = `SELECT COUNT(*) as total FROM payslips ps JOIN employees e ON ps.employee_id = e.employee_id WHERE 1=1`;

  if (req.user.role === 'employee') {
    sql += ` AND e.user_id = $${paramIdx}`;
    countSql += ` AND e.user_id = $${paramIdx}`;
    params.push(req.user.userId);
    paramIdx++;
  }
  if (run_id) {
    sql += ` AND ps.run_id = $${paramIdx}`;
    countSql += ` AND ps.run_id = $${paramIdx}`;
    params.push(run_id);
    paramIdx++;
  }
  if (employee_id) {
    sql += ` AND ps.employee_id = $${paramIdx}`;
    countSql += ` AND ps.employee_id = $${paramIdx}`;
    params.push(employee_id);
    paramIdx++;
  }
  if (payment_status) {
    sql += ` AND ps.payment_status = $${paramIdx}`;
    countSql += ` AND ps.payment_status = $${paramIdx}`;
    params.push(payment_status);
    paramIdx++;
  }

  const countResult = await query(countSql, [...params]);
  const total = parseInt(countResult.rows[0].total);

  sql += ' ORDER BY ps.generated_at DESC';
  sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  params.push(limitNum, offset);

  const result = await query(sql, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

const getPayslipDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let sql = `SELECT ps.*, e.first_name || ' ' || e.last_name as employee_name,
    e.position, e.email, e.phone, d.department_name,
    r.period_month, r.period_year, r.status as run_status
    FROM payslips ps
    JOIN employees e ON ps.employee_id = e.employee_id
    LEFT JOIN departments d ON e.department_id = d.department_id
    LEFT JOIN payroll_runs r ON ps.run_id = r.run_id
    WHERE ps.payslip_id = $1`;
  const params = [id];

  if (req.user.role === 'employee') {
    sql += ' AND e.user_id = $2';
    params.push(req.user.userId);
  }

  const payslipResult = await query(sql, params);
  if (payslipResult.rows.length === 0) throw new NotFoundError('Payslip not found or access denied');

  const payslip = payslipResult.rows[0];

  const earningsResult = await query(
    'SELECT * FROM payslip_earnings WHERE payslip_id = $1 ORDER BY sort_order',
    [id]
  );
  const deductionsResult = await query(
    'SELECT * FROM payslip_deductions WHERE payslip_id = $1 ORDER BY sort_order',
    [id]
  );

  res.json({
    success: true,
    data: {
      payslip_id: payslip.payslip_id,
      employee_name: payslip.employee_name,
      department: payslip.department_name,
      position: payslip.position,
      period: { month: payslip.period_month, year: payslip.period_year },
      basic_salary: parseFloat(payslip.basic_salary),
      gross_pay: parseFloat(payslip.gross_pay),
      total_deductions: parseFloat(payslip.total_deductions),
      net_pay: parseFloat(payslip.net_pay),
      payment_status: payslip.payment_status,
      payment_method: payslip.payment_method,
      payment_date: payslip.payment_date,
      pdf_path: payslip.pdf_path,
      verified: payslip.verified,
      notes: payslip.notes,
      earnings: earningsResult.rows,
      deductions: deductionsResult.rows,
      generated_at: payslip.generated_at,
    },
  });
});

const downloadPayslipPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let sql = 'SELECT ps.*, e.user_id FROM payslips ps JOIN employees e ON ps.employee_id = e.employee_id WHERE ps.payslip_id = $1';
  const params = [id];
  if (req.user.role === 'employee') {
    sql += ' AND e.user_id = $2';
    params.push(req.user.userId);
  }

  const result = await query(sql, params);
  if (result.rows.length === 0) throw new NotFoundError('Payslip not found or access denied');

  const payslip = result.rows[0];
  if (!payslip.pdf_path || !require('fs').existsSync(payslip.pdf_path)) {
    throw new NotFoundError('PDF file not found. Regenerate the payslip.');
  }

  res.download(payslip.pdf_path, `payslip_${id}.pdf`);
});

const emailPayslip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { recipient_email } = req.body;

  const payslipResult = await query(
    `SELECT ps.*, e.first_name || ' ' || e.last_name as employee_name, e.email
     FROM payslips ps JOIN employees e ON ps.employee_id = e.employee_id WHERE ps.payslip_id = $1`,
    [id]
  );
  if (payslipResult.rows.length === 0) throw new NotFoundError('Payslip not found');

  const payslip = payslipResult.rows[0];
  const email = recipient_email || payslip.email;

  await query(
    `INSERT INTO email_queue (payslip_id, recipient_email, recipient_name, subject, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [id, email, payslip.employee_name, `Payslip for ${payslip.employee_name}`]
  );

  res.json({ success: true, message: `Payslip queued for email to ${email}` });
});

const verifyPayslip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT ps.payslip_id, ps.net_pay, ps.gross_pay, ps.total_deductions,
            ps.payment_status, ps.payment_date, ps.generated_at,
            e.first_name || ' ' || e.last_name as employee_name,
            r.period_month, r.period_year, r.status as run_status
     FROM payslips ps
     JOIN employees e ON ps.employee_id = e.employee_id
     LEFT JOIN payroll_runs r ON ps.run_id = r.run_id
     WHERE ps.payslip_id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Payslip not found');

  const payslip = result.rows[0];
  const isValid = payslip.run_status === 'paid' || payslip.run_status === 'archived' || payslip.payment_status === 'paid';

  res.json({
    success: true,
    data: {
      verified: isValid,
      payslip_id: payslip.payslip_id,
      employee_name: payslip.employee_name,
      period: `${getMonthName(payslip.period_month)} ${payslip.period_year}`,
      net_pay: parseFloat(payslip.net_pay),
      payment_status: payslip.payment_status,
      payment_date: payslip.payment_date,
      generated_at: payslip.generated_at,
    },
  });
});

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || month;
};

module.exports = {
  generatePayslip,
  generateBulkPayslips,
  listPayslips,
  getPayslipDetail,
  downloadPayslipPDF,
  emailPayslip,
  verifyPayslip,
};
