import React, { useEffect, useState } from 'react';
import { reportService } from '../services';
import {
  FaChartBar,
  FaUmbrellaBeach,
  FaMoneyBillWave,
  FaUsers,
  FaBullseye,
  FaFileContract,
  FaDownload,
  FaFilter,
  FaArrowRight,
  FaTrash
} from 'react-icons/fa';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    department_id: '',
    employee_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      department_id: '',
      employee_id: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    });
    setReportData(null);
    setSelectedReport(null);
  };

  const generateReport = async (reportType) => {
    setLoading(true);
    setError('');
    setReportData(null);
    setSelectedReport(reportType);

    try {
      let response;
      switch (reportType) {
        case 'attendance':
          response = await reportService.getAttendanceReport(filters);
          break;
        case 'leave':
          response = await reportService.getLeaveReport(filters);
          break;
        case 'payroll':
          response = await reportService.getPayrollReport(filters);
          break;
        case 'employee':
          response = await reportService.getEmployeeReport();
          break;
        case 'demographics':
          response = await reportService.getEmployeeDemographics();
          break;
        case 'recruitment':
          response = await reportService.getRecruitmentReport(filters);
          break;
        default:
          throw new Error('Invalid report type');
      }
      setReportData(response.data);
      setSuccess('Report generated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to generate report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    if (!reportData) {
      setError('Generate a report first!');
      return;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_report_${new Date().toISOString()}.json`;
      a.click();
      setSuccess('Report exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } else if (format === 'csv') {
      // Convert to CSV
      let csvContent = '';

      if (Array.isArray(reportData)) {
        // Get headers
        if (reportData.length > 0) {
          const headers = Object.keys(reportData[0]);
          csvContent = headers.join(',') + '\n';

          // Add rows
          reportData.forEach(row => {
            const values = headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            });
            csvContent += values.join(',') + '\n';
          });
        }
      } else {
        csvContent = JSON.stringify(reportData, null, 2);
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_report_${new Date().toISOString()}.csv`;
      a.click();
      setSuccess('Report exported to CSV!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const renderTableData = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    if (reportData.length === 0) return <p className="text-center text-neutral-500 py-8">No data available for this report.</p>;

    const headers = Object.keys(reportData[0]);

    return (
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, index) => (
              <tr key={index}>
                {headers.map(header => (
                  <td key={header}>
                    {typeof row[header] === 'number' && !header.includes('id') && !header.includes('count')
                      ? parseFloat(row[header]).toFixed(2)
                      : row[header] || 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDemographicsData = () => {
    if (!reportData || typeof reportData !== 'object') return null;

    return (
      <div className="grid grid-cols-4 gap-6">
        {Object.entries(reportData).map(([key, value]) => (
          <div key={key} className="card">
            <h4 className="font-bold text-neutral-800 mb-4 capitalize">{key.replace(/_/g, ' ')}</h4>
            {Array.isArray(value) && value.length > 0 ? (
              <div className="space-y-3">
                {value.map((item, index) => {
                  const name = item.department_name || item.employment_type || item.gender || item.status || 'Unknown';
                  const count = parseInt(item.count) || 0;
                  const total = value.reduce((sum, v) => sum + (parseInt(v.count) || 0), 0);
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="text-neutral-600">{name}</span>
                        <span className="font-semibold text-neutral-800">{count} <span className="text-xs text-neutral-400 font-normal">({percentage}%)</span></span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-400 text-sm italic">No data available</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="card mt-8 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="card-title text-xl">{selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => exportReport('csv')}>
              <FaDownload className="mr-2" /> Export CSV
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportReport('json')}>
              <FaDownload className="mr-2" /> Export JSON
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setReportData(null); setSelectedReport(null); }}>Close</button>
          </div>
        </div>

        {selectedReport === 'demographics' ? renderDemographicsData() : renderTableData()}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h1>
          <p className="text-neutral-500">Generate and export business intelligence reports</p>
        </div>
      </div>

      {error && (
        <div className="badge badge-danger w-full justify-start p-4 mb-6 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="badge badge-success w-full justify-start p-4 mb-6 rounded-lg text-sm">
          {success}
        </div>
      )}

      {loading && (
        <div className="badge badge-info w-full justify-start p-4 mb-6 rounded-lg text-sm animate-pulse">
          Generating report, please wait...
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card border-l-4 border-l-primary-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <FaChartBar size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Report Types</p>
              <h3 className="text-xl font-bold text-neutral-900">6</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-emerald-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FaDownload size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Exports</p>
              <h3 className="text-xl font-bold text-neutral-900">Active</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-indigo-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FaUsers size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Workforce</p>
              <h3 className="text-xl font-bold text-neutral-900">Demographics</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-orange-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <FaBullseye size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</p>
              <h3 className="text-xl font-bold text-neutral-900">Real-time</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Report Filters */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[180px] flex-grow">
              <label className="form-label mb-1">Start Date</label>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <input
                  type="date"
                  className="form-input pl-9 w-full"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
              </div>
            </div>

            <div className="min-w-[180px] flex-grow">
              <label className="form-label mb-1">End Date</label>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <input
                  type="date"
                  className="form-input pl-9 w-full"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="min-w-[120px]">
              <label className="form-label mb-1">Year</label>
              <input
                type="number"
                className="form-input w-full"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                placeholder="2024"
              />
            </div>

            <div className="min-w-[160px]">
              <label className="form-label mb-1">Month</label>
              <select
                className="form-select w-full"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                  <option key={month} value={idx + 1}>{month}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto">
              <button className="btn btn-secondary h-[34px]" onClick={clearFilters}>
                <FaTrash className="mr-1" size={10} /> Clear Filters
              </button>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 italic">
            * Filters apply based on the specific report type selected below.
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { id: 'attendance', name: 'Attendance Report', icon: FaChartBar, color: 'indigo', desc: 'View detailed attendance statistics, lateness trends, and working hours.' },
          { id: 'leave', name: 'Leave Report', icon: FaUmbrellaBeach, color: 'pink', desc: 'Analyze leave balances, patterns, and team availability.' },
          { id: 'payroll', name: 'Payroll Report', icon: FaMoneyBillWave, color: 'emerald', desc: 'Detailed payroll breakdown, tax deductions, and salary summaries.' },
          { id: 'demographics', name: 'Workforce Demographics', icon: FaUsers, color: 'orange', desc: 'Workforce composition, gender ratio, and department distribution.' },
          { id: 'recruitment', name: 'Recruitment Stats', icon: FaBullseye, color: 'cyan', desc: 'Hiring pipeline metrics, open positions, and candidate stats.' },
          { id: 'employee', name: 'Employee Master', icon: FaFileContract, color: 'violet', desc: 'Complete employee database export with all profile details.' }
        ].map(report => (
          <div key={report.id} className={`card p-6 cursor-pointer hover:shadow-lg transition-all border-t-4 border-t-accent-${report.color} group`}
            onClick={() => !loading && generateReport(report.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-accent-${report.color}-light rounded-lg text-accent-${report.color} group-hover:bg-accent-${report.color} group-hover:text-white transition-all`}>
                <report.icon className="text-xl" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-neutral-800 mb-2">{report.name}</h3>
            <p className="text-sm text-neutral-500 mb-4">{report.desc}</p>
            <div className={`text-accent-${report.color} text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all`}>
              Generate Report <FaArrowRight />
            </div>
          </div>
        ))}
      </div>

      {/* Generated Report Display */}
      {renderReportData()}

      {/* Report Features / Help */}
      {!reportData && (
        <div className="card bg-neutral-50 border-none shadow-none">
          <div className="card-header border-none">
            <h3 className="card-title">Report Features</h3>
          </div>
          <div className="grid grid-cols-3 gap-6 p-6">
            <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
                <FaChartBar size={24} />
              </div>
              <h4 className="font-bold mb-2">Real-time Data</h4>
              <p className="text-sm text-neutral-500">All reports fetch live data from the database ensuring accuracy.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
                <FaDownload size={24} />
              </div>
              <h4 className="font-bold mb-2">Export Options</h4>
              <p className="text-sm text-neutral-500">Download reports in CSV or JSON format for external analysis.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
                <FaFilter size={24} />
              </div>
              <h4 className="font-bold mb-2">Advanced Filters</h4>
              <p className="text-sm text-neutral-500">Filter by date, department, employee and more for targeted results.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
