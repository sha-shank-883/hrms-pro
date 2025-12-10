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
  FaBriefcase
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

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Payslips</h1>
          <p className="page-description">View and download your monthly salary slips.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: '1.5rem' }}>
        {payslips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
            <div className="empty-state">
              <div className="empty-state-icon">
                <FaFileInvoiceDollar />
              </div>
              <h3 className="empty-state-title">No Payslips Available</h3>
              <p className="empty-state-description">You don't have any payslips yet. They will appear here once processed by HR.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payslips.map((payslip) => (
              <div
                key={payslip.payroll_id}
                className="card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid #e5e7eb',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4f46e5';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: payslip.payment_status === 'paid' ? '#10b981' : '#f59e0b' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '1.25rem' }}>
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.125rem', color: '#111827' }}>
                      {getMonthName(payslip.month)} {payslip.year}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {payslip.position || 'Employee'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Net Salary</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>
                    {getSetting('currency_symbol', '$')}{parseFloat(payslip.net_salary).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span className={`badge badge-${payslip.payment_status === 'paid' ? 'success' : 'warning'}`}>
                    {payslip.payment_status === 'paid' && <FaCheckCircle size={10} style={{ marginRight: '4px' }} />}
                    {payslip.payment_status !== 'paid' && <FaExclamationTriangle size={10} style={{ marginRight: '4px' }} />}
                    {payslip.payment_status.charAt(0).toUpperCase() + payslip.payment_status.slice(1)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {payslip.payment_date ? formatDate(payslip.payment_date, getSetting('date_format')) : 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => viewPayslip(payslip)}
                  >
                    <FaEye /> View
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => downloadPayslip(payslip)}
                  >
                    <FaDownload /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payslip Detail Modal */}
      {showModal && selectedPayslip && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Payslip Details</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{getMonthName(selectedPayslip.month)} {selectedPayslip.year}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Period</div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{getMonthName(selectedPayslip.month)} {selectedPayslip.year}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${selectedPayslip.payment_status === 'paid' ? 'success' : 'warning'}`}>
                    {selectedPayslip.payment_status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Payment Date</div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>
                    {selectedPayslip.payment_date ? formatDate(selectedPayslip.payment_date, getSetting('date_format')) : 'Pending'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Method</div>
                  <div style={{ fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>{(selectedPayslip.payment_method || 'N/A').replace('_', ' ')}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Earnings</h3>
                <table className="table" style={{ marginTop: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem 0' }}>Basic Salary</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: '600' }}>{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.basic_salary).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 0' }}>Allowances</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: '600' }}>{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.allowances || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 0' }}>Overtime Pay</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: '600' }}>{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.overtime_pay || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 0' }}>Bonus</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: '600' }}>{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.bonus || 0).toLocaleString()}</td>
                    </tr>
                    <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>Total Earnings</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>
                        {getSetting('currency_symbol', '$')}{(parseFloat(selectedPayslip.basic_salary || 0) + parseFloat(selectedPayslip.allowances || 0) + parseFloat(selectedPayslip.overtime_pay || 0) + parseFloat(selectedPayslip.bonus || 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Deductions</h3>
                <table className="table" style={{ marginTop: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem 0' }}>Income Tax</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: '600', color: '#dc2626' }}>{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.tax || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 0' }}>Other Deductions</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: '600', color: '#dc2626' }}>{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.deductions || 0).toLocaleString()}</td>
                    </tr>
                    <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>Total Deductions</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                        {getSetting('currency_symbol', '$')}{(parseFloat(selectedPayslip.tax || 0) + parseFloat(selectedPayslip.deductions || 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#4f46e5', color: 'white', padding: '1.5rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Net Salary (Take Home)</div>
              </div>
              <strong style={{ fontSize: '2rem' }}>{getSetting('currency_symbol', '$')}{parseFloat(selectedPayslip.net_salary).toLocaleString()}</strong>
            </div>

            {selectedPayslip.notes && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#92400e', fontSize: '0.875rem', textTransform: 'uppercase' }}>Notes / Remarks</div>
                <div style={{ fontSize: '0.875rem', color: '#b45309' }}>{selectedPayslip.notes}</div>
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => downloadPayslip(selectedPayslip)}
              >
                <FaPrint /> Print / Download PDF
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
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
