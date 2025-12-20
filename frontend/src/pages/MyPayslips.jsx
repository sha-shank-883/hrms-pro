import React, { useEffect, useState } from 'react';
import { payrollService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import {
  FaReceipt,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaPrint,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDownload,
  FaBuilding,
  FaUser,
  FaBriefcase,
  FaTimes
} from 'react-icons/fa';

const MyPayslips = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      // For employees, we should pass pagination parameters
      const params = {
        page: 1,
        limit: 10
      };
      const response = await payrollService.getAll(params);
      setPayslips(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load payslips: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const viewPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setShowModal(true);
  };

  const downloadPayslip = (payslip) => {
    // Create a professional PDF-like view
    const printWindow = window.open('', '_blank');
    const currencySymbol = getSetting('currency_symbol', '$');
    const companyName = getSetting('company_name', 'HRMS Pro');
    const companyEmail = getSetting('company_email', 'info@company.com');
    const companyAddress = getSetting('company_address', '');
    const companyPhone = getSetting('company_phone', '');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${getMonthName(payslip.month)} ${payslip.year} - ${payslip.employee_name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
              background: #ffffff;
              color: #1f2937;
              line-height: 1.5;
            }
            .payslip-container {
              border: 1px solid #e5e7eb;
              padding: 0;
              background: white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .header {
              background: #4f46e5;
              color: white;
              padding: 40px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .company-info {
              flex: 1;
            }
            .company-logo {
              width: 60px;
              height: 60px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              color: white;
              margin-right: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            .company-details {
              font-size: 12px;
              opacity: 0.9;
              line-height: 1.6;
            }
            .payslip-title {
              background: #f9fafb;
              padding: 20px 40px;
              text-align: center;
              border-bottom: 1px solid #e5e7eb;
            }
            .payslip-title h2 {
              font-size: 18px;
              color: #111827;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .content {
              padding: 40px;
            }
            .employee-info {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 40px;
              padding: 24px;
              background: #f9fafb;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 11px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
            }
            .salary-section {
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              padding: 12px 16px;
              text-align: left;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 12px 16px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
              color: #4b5563;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .amount-right {
              text-align: right;
              font-family: 'Courier New', Courier, monospace;
              font-weight: 600;
            }
            .total-row {
              background: #f9fafb;
              font-weight: bold;
              border-top: 2px solid #e5e7eb;
            }
            .total-row td {
              color: #111827;
            }
            .net-pay-section {
              margin-top: 40px;
              background: #4f46e5;
              color: white;
              padding: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
            .net-pay-label {
              font-size: 16px;
              font-weight: 600;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .net-pay-amount {
              font-size: 32px;
              font-weight: 800;
            }
            .notes-section {
              margin-top: 30px;
              padding: 20px;
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              border-radius: 4px;
            }
            .notes-title {
              font-weight: 700;
              margin-bottom: 8px;
              color: #92400e;
              font-size: 13px;
              text-transform: uppercase;
            }
            .notes-content {
              font-size: 14px;
              color: #b45309;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding: 0 40px;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 1px solid #d1d5db;
              padding-top: 10px;
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              text-transform: uppercase;
            }
            @media print {
              body { 
                padding: 0; 
                margin: 0;
                background: white;
              }
              .payslip-container {
                border: none;
                box-shadow: none;
              }
              .net-pay-section {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="payslip-container">
            <!-- Header with Company Info -->
            <div class="header">
              <div style="display: flex; align-items: center; flex: 1;">
                <div class="company-logo">${companyName.charAt(0)}</div>
                <div class="company-info">
                  <div class="company-name">${companyName}</div>
                  <div class="company-details">
                    ${companyAddress ? `📍 ${companyAddress}<br>` : ''}
                    ${companyEmail ? `📧 ${companyEmail}` : ''}
                    ${companyPhone ? ` | 📞 ${companyPhone}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <!-- Payslip Title -->
            <div class="payslip-title">
              <h2>Payslip for ${getMonthName(payslip.month)} ${payslip.year}</h2>
            </div>

            <!-- Main Content -->
            <div class="content">
              <!-- Employee Information -->
              <div class="employee-info">
                <div class="info-item">
                  <div class="info-label">Employee Name</div>
                  <div class="info-value">${payslip.employee_name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Employee ID</div>
                  <div class="info-value">#${payslip.employee_id}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Department</div>
                  <div class="info-value">${payslip.department_name || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Position</div>
                  <div class="info-value">${payslip.position || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Payment Date</div>
                  <div class="info-value">${payslip.payment_date ? formatDate(payslip.payment_date, getSetting('date_format')) : 'Pending'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Payment Method</div>
                  <div class="info-value" style="text-transform: capitalize;">${(payslip.payment_method || 'N/A').replace('_', ' ')}</div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                <!-- Earnings Section -->
                <div class="salary-section">
                  <table>
                    <thead>
                      <tr>
                        <th>Earnings</th>
                        <th class="amount-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Basic Salary</td>
                        <td class="amount-right">${currencySymbol}${parseFloat(payslip.basic_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>Allowances</td>
                        <td class="amount-right">${currencySymbol}${parseFloat(payslip.allowances || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>Overtime Pay</td>
                        <td class="amount-right">${currencySymbol}${parseFloat(payslip.overtime_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>Bonus / Incentives</td>
                        <td class="amount-right">${currencySymbol}${parseFloat(payslip.bonus || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr class="total-row">
                        <td>Total Earnings</td>
                        <td class="amount-right">${currencySymbol}${(parseFloat(payslip.basic_salary || 0) + parseFloat(payslip.allowances || 0) + parseFloat(payslip.overtime_pay || 0) + parseFloat(payslip.bonus || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Deductions Section -->
                <div class="salary-section">
                  <table>
                    <thead>
                      <tr>
                        <th>Deductions</th>
                        <th class="amount-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Income Tax (TDS)</td>
                        <td class="amount-right">${currencySymbol}${parseFloat(payslip.tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td>Other Deductions</td>
                        <td class="amount-right">${currencySymbol}${parseFloat(payslip.deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr class="total-row">
                        <td>Total Deductions</td>
                        <td class="amount-right">${currencySymbol}${(parseFloat(payslip.tax || 0) + parseFloat(payslip.deductions || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Net Pay -->
              <div class="net-pay-section">
                <div class="net-pay-label">Net Pay (Take Home)</div>
                <div class="net-pay-amount">${currencySymbol}${parseFloat(payslip.net_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>

              ${payslip.notes ? `
              <div class="notes-section">
                <div class="notes-title">Notes / Remarks</div>
                <div class="notes-content">${payslip.notes}</div>
              </div>
              ` : ''}

              <!-- Signature Section -->
              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line">Employee Signature</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line">Authorized Signatory</div>
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p>This is a computer-generated payslip and does not require a physical signature.</p>
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || month;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return (

    <div className="w-full pb-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Payslips</h1>
          <p className="mt-1 text-neutral-600">View and download your monthly salary slips.</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 flex items-center"><FaExclamationTriangle className="mr-2" /> {error}</div>}

      <div className="card p-6">
        {payslips.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <div className="flex flex-col items-center justify-center">
              <div className="p-4 bg-neutral-50 rounded-full mb-4 text-neutral-400">
                <FaFileInvoiceDollar size={32} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-700 mb-1">No Payslips Available</h3>
              <p className="text-sm">You don't have any payslips yet. They will appear here once processed by HR.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payslips.map((payslip) => (
              <div
                key={payslip.payroll_id}
                className="group relative bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-500 transition-all duration-200 cursor-pointer"
                onClick={() => viewPayslip(payslip)}
              >
                <div className={`absolute top-0 right-0 w-1 h-full rounded-r-xl ${payslip.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 text-xl">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-neutral-900 leading-tight">
                      {getMonthName(payslip.month)} {payslip.year}
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      {payslip.position || 'Employee'}
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Net Salary</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {getSetting('currency_symbol', '$')}{parseFloat(payslip.net_salary).toLocaleString()}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className={`badge ${payslip.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {payslip.payment_status === 'paid' ? <FaCheckCircle className="mr-1.5" size={10} /> : <FaExclamationTriangle className="mr-1.5" size={10} />}
                    <span className="capitalize">{payslip.payment_status}</span>
                  </span>
                  <span className="text-xs font-medium text-neutral-500">
                    {payslip.payment_date ? formatDate(payslip.payment_date, getSetting('date_format')) : 'Pending'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="btn btn-primary flex-1 justify-center"
                    onClick={(e) => { e.stopPropagation(); viewPayslip(payslip); }}
                  >
                    <FaEye className="mr-2" /> View
                  </button>
                  <button
                    className="btn btn-secondary flex-1 justify-center"
                    onClick={(e) => { e.stopPropagation(); downloadPayslip(payslip); }}
                  >
                    <FaDownload className="mr-2" /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payslip Detail Modal */}
      {showModal && selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 sticky top-0 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Payslip Details</h2>
                <p className="text-sm text-neutral-500">{getMonthName(selectedPayslip.month)} {selectedPayslip.year}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Close"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Period</div>
                    <div className="font-semibold text-neutral-900">{getMonthName(selectedPayslip.month)} {selectedPayslip.year}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</div>
                    <span className={`badge ${selectedPayslip.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedPayslip.payment_status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Payment Date</div>
                    <div className="font-semibold text-neutral-900">
                      {selectedPayslip.payment_date ? formatDate(selectedPayslip.payment_date, getSetting('date_format')) : 'Pending'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Method</div>
                    <div className="font-semibold text-neutral-900 capitalize">{(selectedPayslip.payment_method || 'N/A').replace('_', ' ')}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="card p-0 overflow-hidden h-full">
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                    <h3 className="font-bold text-neutral-800">Earnings</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td className="px-4 py-3 text-neutral-600">Basic Salary</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-neutral-900">{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.basic_salary).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-neutral-600">Allowances</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-neutral-900">{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.allowances || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-neutral-600">Overtime Pay</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-neutral-900">{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.overtime_pay || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-neutral-600">Bonus</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-neutral-900">{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.bonus || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-neutral-50 font-bold">
                        <td className="px-4 py-3 text-neutral-800">Total Earnings</td>
                        <td className="px-4 py-3 text-right text-neutral-900">
                          {getSetting('currency_symbol', '$')}{(parseFloat(selectedPayslip.basic_salary || 0) + parseFloat(selectedPayslip.allowances || 0) + parseFloat(selectedPayslip.overtime_pay || 0) + parseFloat(selectedPayslip.bonus || 0)).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="card p-0 overflow-hidden h-full">
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                    <h3 className="font-bold text-neutral-800">Deductions</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td className="px-4 py-3 text-neutral-600">Income Tax</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-red-600">{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.tax || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-neutral-600">Other Deductions</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-red-600">{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.deductions || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-neutral-50 font-bold">
                        <td className="px-4 py-3 text-neutral-800">Total Deductions</td>
                        <td className="px-4 py-3 text-right text-red-600">
                          {getSetting('currency_symbol', '$')}{(parseFloat(selectedPayslip.tax || 0) + parseFloat(selectedPayslip.deductions || 0)).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-indigo-600 text-white p-6 rounded-xl flex justify-between items-center shadow-lg shadow-indigo-200">
                <div>
                  <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Net Salary (Take Home)</div>
                  <div className="text-sm opacity-90">Transferred via {(selectedPayslip.payment_method || 'bank transfer').replace('_', ' ')}</div>
                </div>
                <div className="text-3xl font-bold tracking-tight">{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.net_salary).toLocaleString()}</div>
              </div>

              {selectedPayslip.notes && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 border-l-4 border-l-amber-500">
                  <div className="font-bold text-xs uppercase tracking-wider text-amber-900/70 mb-1">Notes / Remarks</div>
                  <div className="text-sm">{selectedPayslip.notes}</div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-100 flex gap-4 bg-neutral-50 rounded-b-xl">
              <button
                className="btn btn-primary flex-1 justify-center"
                onClick={() => downloadPayslip(selectedPayslip)}
              >
                <FaPrint className="mr-2" /> Print / Download PDF
              </button>
              <button
                className="btn btn-secondary flex-1 justify-center"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPayslips;
