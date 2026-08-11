const asyncHandler = require('../utils/asyncHandler');
const { ValidationError } = require('../utils/errors');
const exportService = require('../services/exportService');

const exportPayslips = asyncHandler(async (req, res) => {
  const { run_id, month, year, payment_status } = req.query;
  const filePath = await exportService.exportPayslipsToCSV({ run_id, month, year, payment_status });

  res.download(filePath, `payslips_${new Date().toISOString().split('T')[0]}.csv`);
});

const exportRuns = asyncHandler(async (req, res) => {
  const { status, year } = req.query;
  const filePath = await exportService.exportPayrollRunsToCSV({ status, year });

  res.download(filePath, `payroll_runs_${new Date().toISOString().split('T')[0]}.csv`);
});

const exportEarnings = asyncHandler(async (req, res) => {
  const { run_id } = req.query;
  if (!run_id) throw new ValidationError('run_id is required');

  const filePath = await exportService.exportEarningsBreakdown(run_id);
  res.download(filePath, `earnings_breakdown_${run_id}_${new Date().toISOString().split('T')[0]}.csv`);
});

module.exports = { exportPayslips, exportRuns, exportEarnings };
