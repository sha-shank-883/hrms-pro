import React, { useState } from 'react';
import { payrollService } from '../../services';
import { useSettings } from '../../hooks/useSettings.jsx';
import { formatDate } from '../../utils/settingsHelper';
import {
  FaTimes,
  FaDownload,
  FaPrint,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaQrcode,
  FaBuilding,
  FaUser,
  FaIdBadge,
  FaMoneyBillWave,
  FaSpinner
} from 'react-icons/fa';

const PayslipDetailModal = ({ payslip, onClose, onUpdate }) => {
  const { getSetting } = useSettings();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [verification, setVerification] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  const currency = getSetting('currency_symbol', '$');

  const fetchDetail = async () => {
    if (detail) return;
    try {
      setLoading(true);
      const id = payslip.id || payslip.payroll_id;
      const res = await payrollService.getPayslipV2(id);
      setDetail(res.data);
    } catch (err) {
      setActionError('Failed to load payslip details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setActionError('');
      const id = payslip.id || payslip.payroll_id;
      const res = await payrollService.verifyPayslip(id);
      setVerification(res.data);
    } catch (err) {
      setActionError('Verification failed');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setActionError('');
      const id = payslip.id || payslip.payroll_id;
      const blob = await payrollService.downloadPayslipPdf(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setActionError('Failed to download PDF');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const payslip = detail || payslip;
    const companyName = getSetting('company_name', 'HRMS Pro');
    const companyEmail = getSetting('company_email', '');
    const companyAddress = getSetting('company_address', '');

    const earnings = payslip.earnings || [];
    const deductions = payslip.deductions || [];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1f2937; }
            .header { background: #4f46e5; color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }
            .company-name { font-size: 22px; font-weight: 800; letter-spacing: 0.3px; }
            .company-details { font-size: 12px; opacity: 0.85; line-height: 1.6; margin-top: 4px; }
            .title { background: #f9fafb; padding: 16px 40px; text-align: center; border-bottom: 1px solid #e5e7eb; }
            .title h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #111827; }
            .content { padding: 40px; }
            .employee-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 24px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 32px; }
            .info-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 14px; font-weight: 600; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f3f4f6; color: #374151; padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            td { padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; }
            .amount-right { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
            .total-row { background: #f9fafb; font-weight: bold; }
            .total-row td { color: #111827; }
            .net-pay { margin-top: 24px; background: #4f46e5; color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; }
            .net-pay-label { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .net-pay-amount { font-size: 28px; font-weight: 800; }
            .verification { margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; text-align: center; }
            .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px; }
            @media print { body { padding: 0; } .header { -webkit-print-color-adjust: exact; } .net-pay { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">${companyName}</div>
              <div class="company-details">${companyAddress}<br>${companyEmail}</div>
            </div>
          </div>
          <div class="title"><h2>Payslip for ${payslip.period_month || payslip.month}/${payslip.period_year || payslip.year}</h2></div>
          <div class="content">
            <div class="employee-grid">
              <div><div class="info-label">Employee</div><div class="info-value">${payslip.employee_name || ''}</div></div>
              <div><div class="info-label">Department</div><div class="info-value">${payslip.department_name || 'N/A'}</div></div>
              <div><div class="info-label">Designation</div><div class="info-value">${payslip.designation || payslip.position || 'N/A'}</div></div>
              <div><div class="info-label">Status</div><div class="info-value">${payslip.payment_status || 'N/A'}</div></div>
            </div>
            <table>
              <thead><tr><th>Earnings</th><th class="amount-right">Amount</th></tr></thead>
              <tbody>
                ${earnings.length > 0 ? earnings.map(e =>
      `<tr><td>${e.component_name}</td><td class="amount-right">${currency}${parseFloat(e.amount).toLocaleString()}</td></tr>`
    ).join('') : `
                  <tr><td>Basic Salary</td><td class="amount-right">${currency}${parseFloat(payslip.basic_salary || 0).toLocaleString()}</td></tr>
                  <tr><td>Total Earnings</td><td class="amount-right">${currency}${parseFloat(payslip.gross_pay || payslip.net_salary || 0).toLocaleString()}</td></tr>
                `}
                ${earnings.length > 0 ? `<tr class="total-row"><td>Total Earnings</td><td class="amount-right">${currency}${earnings.reduce((s, e) => s + parseFloat(e.amount), 0).toLocaleString()}</td></tr>` : ''}
              </tbody>
            </table>
            <table>
              <thead><tr><th>Deductions</th><th class="amount-right">Amount</th></tr></thead>
              <tbody>
                ${deductions.length > 0 ? deductions.map(d =>
      `<tr><td>${d.component_name}</td><td class="amount-right">${currency}${parseFloat(d.amount).toLocaleString()}</td></tr>`
    ).join('') : `
                  <tr><td>Tax</td><td class="amount-right">${currency}${parseFloat(payslip.tax || 0).toLocaleString()}</td></tr>
                  <tr><td>Other Deductions</td><td class="amount-right">${currency}${parseFloat(payslip.deductions || 0).toLocaleString()}</td></tr>
                `}
                ${deductions.length > 0 ? `<tr class="total-row"><td>Total Deductions</td><td class="amount-right">${currency}${deductions.reduce((s, d) => s + parseFloat(d.amount), 0).toLocaleString()}</td></tr>` : ''}
              </tbody>
            </table>
            <div class="net-pay">
              <div class="net-pay-label">Net Pay (Take Home)</div>
              <div class="net-pay-amount">${currency}${parseFloat(payslip.net_pay || payslip.net_salary || 0).toLocaleString()}</div>
            </div>
            <div class="verification">
              <strong>✓ VERIFIED</strong> — This payslip is digitally signed and verified
            </div>
          </div>
          <div class="footer">
            <p>This is a computer-generated payslip. Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <script>window.onload = function() { setTimeout(() => window.print(), 300); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEmail = async () => {
    try {
      setActionError('');
      const id = payslip.id || payslip.payroll_id;
      await payrollService.queuePayslipEmail(id);
      setActionMsg('Payslip queued for email delivery');
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionError('Failed to queue email');
    }
  };

  React.useEffect(() => { fetchDetail(); }, []);

  const id = payslip.id || payslip.payroll_id;
  const periodLabel = `${payslip.period_month || payslip.month}/${payslip.period_year || payslip.year}`;
  const statusColor = payslip.payment_status === 'paid' || payslip.payment_status === 'verified'
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-md flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payslip #{id}</h2>
            <p className="text-sm text-gray-500">{periodLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><FaTimes /></button>
        </div>

        {actionMsg && (
          <div className="mx-6 mt-4 px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 text-sm">
            <FaCheckCircle /> {actionMsg}
          </div>
        )}
        {actionError && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 text-sm">
            <FaExclamationTriangle /> {actionError}
            <button onClick={() => setActionError('')} className="ml-auto"><FaTimes /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-3xl text-primary-600" /></div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Employee</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <FaUser className="text-primary-500 text-xs" /> {payslip.employee_name || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Department</div>
                    <div className="font-medium text-gray-700">{payslip.department_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Period</div>
                    <div className="font-medium text-gray-700">{periodLabel}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${statusColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${payslip.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-400'}`} />
                      {(payslip.payment_status || 'pending').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
                    <h3 className="font-bold text-primary-800 flex items-center gap-2"><FaMoneyBillWave /> Earnings</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(detail?.earnings || []).length > 0 ? detail.earnings.map((e, i) => (
                      <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-gray-600">{e.component_name}</span>
                        <span className="font-mono font-medium text-gray-900">{currency}{parseFloat(e.amount).toLocaleString()}</span>
                      </div>
                    )) : (
                      <>
                        <div className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-gray-600">Basic Salary</span>
                          <span className="font-mono font-medium text-gray-900">{currency}{parseFloat(payslip.basic_salary || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-gray-600">Allowances</span>
                          <span className="font-mono font-medium text-gray-900">{currency}{parseFloat(payslip.allowances || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-gray-600">Bonus + OT</span>
                          <span className="font-mono font-medium text-gray-900">{currency}{parseFloat((payslip.bonus || 0) + (payslip.overtime_pay || 0)).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between px-4 py-3 bg-gray-50 text-sm font-bold">
                      <span className="text-gray-800">Total Earnings</span>
                      <span className="font-mono text-primary-600">{currency}{parseFloat(detail?.gross_pay || payslip.gross_pay || payslip.net_salary || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-red-50 border-b border-red-100">
                    <h3 className="font-bold text-red-800">Deductions</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(detail?.deductions || []).length > 0 ? detail.deductions.map((d, i) => (
                      <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-gray-600">{d.component_name}</span>
                        <span className="font-mono font-medium text-red-600">{currency}{parseFloat(d.amount).toLocaleString()}</span>
                      </div>
                    )) : (
                      <>
                        <div className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-gray-600">Tax (TDS)</span>
                          <span className="font-mono font-medium text-red-600">{currency}{parseFloat(payslip.tax || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-gray-600">Other Deductions</span>
                          <span className="font-mono font-medium text-red-600">{currency}{parseFloat(payslip.deductions || 0).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between px-4 py-3 bg-gray-50 text-sm font-bold">
                      <span className="text-gray-800">Total Deductions</span>
                      <span className="font-mono text-red-600">{currency}{parseFloat(detail?.total_deductions || payslip.total_deductions || (payslip.tax || 0) + (payslip.deductions || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary-600 text-white p-6 rounded-xl flex justify-between items-center shadow-lg shadow-primary-200">
                <div>
                  <div className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-1">Net Pay (Take Home)</div>
                  <div className="text-sm opacity-90">{payslip.employee_name || 'Employee'}</div>
                </div>
                <div className="text-3xl font-bold tracking-tight">{currency}{parseFloat(detail?.net_pay || payslip.net_pay || payslip.net_salary || 0).toLocaleString()}</div>
              </div>

              <div className="border border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FaShieldAlt className="text-green-600" /> Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <button onClick={handleVerify}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                      <FaCheckCircle /> {verification ? 'Verified' : 'Verify Authenticity'}
                    </button>
                    {verification && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                          <FaCheckCircle /> Verified
                        </div>
                        <p className="text-green-600 text-xs mt-1">
                          Hash: {verification.verification_hash || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                    <div className="text-center">
                      <FaQrcode className="text-4xl text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">QR Code Verification</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <div className="flex gap-2">
            <button onClick={handleDownloadPdf} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
              <FaDownload /> PDF
            </button>
            <button onClick={handlePrint} className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
              <FaPrint /> Print
            </button>
            <button onClick={handleEmail} className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
              <FaEnvelope /> Email
            </button>
          </div>
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetailModal;
