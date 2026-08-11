const { query } = require('../config/database');

const getSetting = async (key, defaultValue = null) => {
  try {
    const result = await query('SELECT setting_value FROM settings WHERE setting_key = $1', [key]);
    return result.rows.length > 0 ? result.rows[0].setting_value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

const calculatePayslip = async (employeeId, month, year) => {
  const employee = await fetchEmployee(employeeId);
  if (!employee) throw new Error('Employee not found');

  const baseSalary = parseFloat(employee.salary || 0);
  const settings = await fetchPayrollSettings();

  const attendance = await computeAttendance(employeeId, month, year, settings);
  const leaveDays = await computeLeaveDays(employeeId, month, year);

  const workingDaysInfo = computeWorkingDays(month, year, parseInt(settings.working_days || '5'));
  const absentDays = Math.max(0, workingDaysInfo.totalWorkingDays - attendance.presentDays - leaveDays);
  const dailyRate = workingDaysInfo.totalWorkingDays > 0 ? baseSalary / workingDaysInfo.totalWorkingDays : 0;

  const earnings = await computeEarnings(baseSalary, attendance, settings, dailyRate, workingDaysInfo.totalWorkingDays);
  const deductions = await computeDeductions(employeeId, baseSalary, earnings.grossPay, attendance, settings, dailyRate);

  const grossPay = earnings.grossPay;
  const totalDeductions = deductions.totalDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    employeeId,
    employeeName: `${employee.first_name} ${employee.last_name}`,
    department: employee.department_name,
    position: employee.position,
    period: { month, year },
    basicSalary: baseSalary,
    workingDays: workingDaysInfo.totalWorkingDays,
    presentDays: attendance.presentDays,
    absentDays,
    leaveDays,
    overtimeHours: attendance.overtimeHours,
    earnings: earnings.items,
    deductions: deductions.items,
    grossPay: Math.round(grossPay * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
  };
};

const fetchEmployee = async (employeeId) => {
  const result = await query(
    `SELECT e.*, d.department_name
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.department_id
     WHERE e.employee_id = $1`,
    [employeeId]
  );
  return result.rows[0] || null;
};

const fetchPayrollSettings = async () => {
  const keys = [
    'currency', 'currency_symbol', 'pay_frequency', 'working_hours', 'working_days',
    'tax_enabled', 'default_tax_rate', 'social_security_rate', 'medicare_rate',
    'bonus_enabled', 'allowances_enabled', 'deductions_enabled', 'default_allowances',
    'overtime_rate', 'overtime_enabled', 'late_arrival_deduction_rate',
    'early_departure_deduction_rate', 'late_arrival_threshold', 'early_departure_threshold',
    'pf_enabled', 'pf_rate', 'esi_enabled', 'esi_rate', 'esi_threshold',
    'professional_tax_enabled', 'professional_tax_amount',
  ];
  const settings = {};
  for (const key of keys) {
    settings[key] = await getSetting(key, null);
  }
  return settings;
};

const computeAttendance = async (employeeId, month, year, settings) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const workingHours = parseFloat(settings.working_hours || '8');
  const lateThreshold = parseInt(settings.late_arrival_threshold || '15');
  const earlyThreshold = parseInt(settings.early_departure_threshold || '15');

  const result = await query(
    `SELECT * FROM attendance WHERE employee_id = $1 AND date >= $2 AND date <= $3`,
    [employeeId, startDate, endDate]
  );

  let presentDays = 0;
  let totalWorkHours = 0;
  let lateArrivals = 0;
  let earlyDepartures = 0;

  for (const record of result.rows) {
    if (record.status === 'present') {
      presentDays++;
      totalWorkHours += parseFloat(record.work_hours || 0);

      if (record.clock_in) {
        const expectedStart = new Date(`${record.date}T09:00:00`);
        const actualStart = new Date(`${record.date}T${record.clock_in}`);
        const minutesLate = (actualStart - expectedStart) / (1000 * 60);
        if (minutesLate > lateThreshold) lateArrivals++;
      }

      if (record.clock_out) {
        const expectedEnd = new Date(`${record.date}T17:00:00`);
        const actualEnd = new Date(`${record.date}T${record.clock_out}`);
        const minutesEarly = (expectedEnd - actualEnd) / (1000 * 60);
        if (minutesEarly > earlyThreshold) earlyDepartures++;
      }
    }
  }

  const expectedHours = presentDays * workingHours;
  const overtimeHours = Math.max(0, totalWorkHours - expectedHours);

  return { presentDays, totalWorkHours, lateArrivals, earlyDepartures, overtimeHours };
};

const computeLeaveDays = async (employeeId, month, year) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const result = await query(
    `SELECT * FROM leave_requests
     WHERE employee_id = $1 AND status = 'approved'
     AND ((start_date <= $2 AND end_date >= $3) OR (start_date >= $3 AND start_date <= $2))`,
    [employeeId, endDate, startDate]
  );

  let totalDays = 0;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);

  for (const leave of result.rows) {
    const leaveStart = new Date(leave.start_date);
    const leaveEnd = new Date(leave.end_date);
    const overlapStart = leaveStart > monthStart ? leaveStart : monthStart;
    const overlapEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd;
    if (overlapStart <= overlapEnd) {
      const diff = overlapEnd.getTime() - overlapStart.getTime();
      totalDays += Math.ceil(diff / (1000 * 3600 * 24)) + 1;
    }
  }

  return totalDays;
};

const computeWorkingDays = (month, year, workingDaysPerWeek) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalWorkingDays = Math.floor((daysInMonth * workingDaysPerWeek) / 7);
  return { daysInMonth, totalWorkingDays };
};

const computeEarnings = async (baseSalary, attendance, settings, dailyRate, totalWorkingDays) => {
  const items = [];
  let grossPay = 0;
  let sortOrder = 1;

  const basicPay = baseSalary;
  items.push({ component_name: 'Basic Salary', amount: basicPay, is_taxable: true, sort_order: sortOrder++ });
  grossPay += basicPay;

  if (settings.allowances_enabled === 'true') {
    const defaultAllowances = parseFloat(settings.default_allowances || '0');
    if (defaultAllowances > 0) {
      const hra = Math.round(basicPay * 0.4 * 100) / 100;
      items.push({ component_name: 'HRA', amount: hra, is_taxable: false, sort_order: sortOrder++ });
      grossPay += hra;

      const conveyance = 1600;
      items.push({ component_name: 'Conveyance Allowance', amount: conveyance, is_taxable: false, sort_order: sortOrder++ });
      grossPay += conveyance;

      const medical = 1250;
      items.push({ component_name: 'Medical Allowance', amount: medical, is_taxable: false, sort_order: sortOrder++ });
      grossPay += medical;

      const special = Math.round((defaultAllowances - hra - conveyance - medical) * 100) / 100;
      if (special > 0) {
        items.push({ component_name: 'Special Allowance', amount: special, is_taxable: true, sort_order: sortOrder++ });
        grossPay += special;
      }
    }
  }

  if (settings.overtime_enabled === 'true' && attendance.overtimeHours > 0) {
    const hourlyRate = totalWorkingDays > 0 ? baseSalary / (totalWorkingDays * parseFloat(settings.working_hours || '8')) : 0;
    const overtimeRate = parseFloat(settings.overtime_rate || '1.5');
    const overtimePay = Math.round(attendance.overtimeHours * hourlyRate * overtimeRate * 100) / 100;
    items.push({ component_name: 'Overtime Pay', amount: overtimePay, is_taxable: true, sort_order: sortOrder++ });
    grossPay += overtimePay;
  }

  if (settings.bonus_enabled === 'true') {
    const bonus = 0;
    if (bonus > 0) {
      items.push({ component_name: 'Bonus', amount: bonus, is_taxable: true, sort_order: sortOrder++ });
      grossPay += bonus;
    }
  }

  return { items, grossPay: Math.round(grossPay * 100) / 100 };
};

const computeDeductions = async (employeeId, baseSalary, grossPay, attendance, settings, dailyRate) => {
  const items = [];
  let totalDeductions = 0;
  let sortOrder = 1;

  const lateDeductionRate = parseFloat(settings.late_arrival_deduction_rate || '1');
  const earlyDeductionRate = parseFloat(settings.early_departure_deduction_rate || '1');
  const lateDeduction = attendance.lateArrivals > 0 ? Math.round(attendance.lateArrivals * dailyRate * lateDeductionRate / 100 * 100) / 100 : 0;
  const earlyDeduction = attendance.earlyDepartures > 0 ? Math.round(attendance.earlyDepartures * dailyRate * earlyDeductionRate / 100 * 100) / 100 : 0;

  if (lateDeduction > 0) {
    items.push({ component_name: 'Late Arrival Deduction', amount: lateDeduction, is_mandatory: true, sort_order: sortOrder++ });
    totalDeductions += lateDeduction;
  }

  if (earlyDeduction > 0) {
    items.push({ component_name: 'Early Departure Deduction', amount: earlyDeduction, is_mandatory: true, sort_order: sortOrder++ });
    totalDeductions += earlyDeduction;
  }

  if (settings.pf_enabled === 'true') {
    const pfRate = parseFloat(settings.pf_rate || '12');
    const pfAmount = Math.round(baseSalary * pfRate / 100 * 100) / 100;
    items.push({ component_name: 'Provident Fund', amount: pfAmount, is_mandatory: true, sort_order: sortOrder++ });
    totalDeductions += pfAmount;
  }

  if (settings.esi_enabled === 'true') {
    const esiThreshold = parseFloat(settings.esi_threshold || '21000');
    if (grossPay <= esiThreshold) {
      const esiRate = parseFloat(settings.esi_rate || '0.75');
      const esiAmount = Math.round(grossPay * esiRate / 100 * 100) / 100;
      items.push({ component_name: 'ESI', amount: esiAmount, is_mandatory: true, sort_order: sortOrder++ });
      totalDeductions += esiAmount;
    }
  }

  if (settings.professional_tax_enabled === 'true') {
    const ptAmount = parseFloat(settings.professional_tax_amount || '200');
    items.push({ component_name: 'Professional Tax', amount: ptAmount, is_mandatory: true, sort_order: sortOrder++ });
    totalDeductions += ptAmount;
  }

  if (settings.tax_enabled === 'true') {
    const taxRate = parseFloat(settings.default_tax_rate || '20');
    const taxableIncome = grossPay - totalDeductions;

    const taxDeclResult = await query(
      `SELECT * FROM tax_declarations WHERE employee_id = $1 AND financial_year = $2 AND status = 'approved'`,
      [employeeId, getFinancialYear()]
    );

    let annualTaxableIncome = taxableIncome * 12;
    if (taxDeclResult.rows.length > 0) {
      const decl = taxDeclResult.rows[0];
      if (decl.regime === 'old') {
        const deductions80c = parseFloat(decl.section_80c || 0);
        const deductions80d = parseFloat(decl.section_80d || 0);
        const hraExemption = parseFloat(decl.hra || 0);
        const ltaExemption = parseFloat(decl.lta || 0);
        const otherDeductions = parseFloat(decl.other_deductions || 0);
        annualTaxableIncome = Math.max(0, annualTaxableIncome - deductions80c - deductions80d - hraExemption - ltaExemption - otherDeductions);
      }
    }

    const monthlyTax = annualTaxableIncome > 250000 ? Math.round(annualTaxableIncome * taxRate / 100 / 12 * 100) / 100 : 0;
    if (monthlyTax > 0) {
      items.push({ component_name: 'Income Tax (TDS)', amount: monthlyTax, is_mandatory: true, sort_order: sortOrder++ });
      totalDeductions += monthlyTax;
    }
  }

  const ssRate = parseFloat(settings.social_security_rate || '0');
  if (ssRate > 0) {
    const ssAmount = Math.round(grossPay * ssRate / 100 * 100) / 100;
    items.push({ component_name: 'Social Security', amount: ssAmount, is_mandatory: true, sort_order: sortOrder++ });
    totalDeductions += ssAmount;
  }

  const mcRate = parseFloat(settings.medicare_rate || '0');
  if (mcRate > 0) {
    const mcAmount = Math.round(grossPay * mcRate / 100 * 100) / 100;
    items.push({ component_name: 'Medicare', amount: mcAmount, is_mandatory: true, sort_order: sortOrder++ });
    totalDeductions += mcAmount;
  }

  return { items, totalDeductions: Math.round(totalDeductions * 100) / 100 };
};

const getFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

const generatePayslipData = async (employeeId, month, year) => {
  return calculatePayslip(employeeId, month, year);
};

const generateBulkPayslipData = async (month, year) => {
  const employeesResult = await query(
    'SELECT employee_id FROM employees'
  );

  const results = [];
  for (const emp of employeesResult.rows) {
    try {
      const data = await calculatePayslip(emp.employee_id, month, year);
      results.push({ employee_id: emp.employee_id, status: 'success', data });
    } catch (err) {
      results.push({ employee_id: emp.employee_id, status: 'error', error: err.message });
    }
  }
  return results;
};

module.exports = {
  calculatePayslip,
  generatePayslipData,
  generateBulkPayslipData,
  computeWorkingDays,
};
