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
  FaArrowRight
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Report Filters */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <FaFilter className="text-neutral-400" /> Report Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <input type="number" className="form-input" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} placeholder="2024" />
          </div>
          <div className="form-group">
            <label className="form-label">Month</label>
            <select className="form-input" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                <option key={month} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 pb-4">
          <p className="text-xs text-neutral-400 italic">Filters are applied based on the report type. Not all filters apply to all reports.</p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { id: 'attendance', name: 'Attendance Report', icon: FaChartBar, color: 'indigo', desc: 'View detailed attendance statistics, lateness trends, and working hours.' },
          { id: 'leave', name: 'Leave Report', icon: FaUmbrellaBeach, color: 'pink', desc: 'Analyze leave balances, patterns, and team availability.' },
          { id: 'payroll', name: 'Payroll Report', icon: FaMoneyBillWave, color: 'emerald', desc: 'Detailed payroll breakdown, tax deductions, and salary summaries.' },
          { id: 'demographics', name: 'Workforce Demographics', icon: FaUsers, color: 'orange', desc: 'Workforce composition, gender ratio, and department distribution.' },
          { id: 'recruitment', name: 'Recruitment Stats', icon: FaBullseye, color: 'cyan', desc: 'Hiring pipeline metrics, open positions, and candidate stats.' },
          { id: 'employee', name: 'Employee Master', icon: FaFileContract, color: 'violet', desc: 'Complete employee database export with all profile details.' }
        ].map(report => (
          <div
            key={report.id}
            className={`card cursor-pointer hover:shadow-lg transition-all border-t-4 border-t-accent-${report.color} group`}
            onClick={() => !loading && generateReport(report.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-accent-${report.color} bg-opacity-10 rounded-lg text-accent-${report.color} group-hover:bg-opacity-20 transition-colors`}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
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
