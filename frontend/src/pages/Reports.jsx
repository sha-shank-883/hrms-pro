import React, { useEffect, useState } from 'react';
import { reportService } from '../services';

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
      switch(reportType) {
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
    if (reportData.length === 0) return <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No data available for this report.</p>;

    const headers = Object.keys(reportData[0]);
    
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
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
      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
        {Object.entries(reportData).map(([key, value]) => (
          <div key={key} className="card">
            <h4 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</h4>
            {Array.isArray(value) && value.length > 0 ? (
              <div>
                {value.map((item, index) => {
                  const name = item.department_name || item.employment_type || item.gender || item.status || 'Unknown';
                  const count = parseInt(item.count) || 0;
                  const total = value.reduce((sum, v) => sum + (parseInt(v.count) || 0), 0);
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={index} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>{name}</span>
                        <span><strong>{count}</strong> ({percentage}%)</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No data available</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>{selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => exportReport('csv')}>Export CSV</button>
            <button className="btn btn-primary" onClick={() => exportReport('json')}>Export JSON</button>
            <button className="btn btn-secondary" onClick={() => { setReportData(null); setSelectedReport(null); }}>Close</button>
          </div>
        </div>
        
        {selectedReport === 'demographics' ? renderDemographicsData() : renderTableData()}
      </div>
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Reports & Analytics</h1>

      {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.375rem' }}>{success}</div>}
      {loading && <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '0.375rem' }}>Generating report...</div>}

      {/* Report Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Report Filters</h3>
        <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Year</label>
            <input type="number" className="form-input" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} placeholder="2024" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Month</label>
            <select className="form-input" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Filters are applied based on the report type. Not all filters apply to all reports.</p>
      </div>
      
      {/* Report Cards */}
      <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', cursor: 'pointer' }} onClick={() => !loading && generateReport('attendance')}>
          <h3><i className="fas fa-chart-bar"></i> Attendance Report</h3>
          <p style={{ margin: '1rem 0', opacity: 0.9 }}>View detailed attendance statistics and trends</p>
          <button className="btn" style={{ backgroundColor: 'white', color: '#667eea' }} disabled={loading}>Generate Report</button>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', cursor: 'pointer' }} onClick={() => !loading && generateReport('leave')}>
          <h3><i className="fas fa-umbrella-beach"></i> Leave Report</h3>
          <p style={{ margin: '1rem 0', opacity: 0.9 }}>Analyze leave patterns and balances</p>
          <button className="btn" style={{ backgroundColor: 'white', color: '#f5576c' }} disabled={loading}>Generate Report</button>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', cursor: 'pointer' }} onClick={() => !loading && generateReport('payroll')}>
          <h3><i className="fas fa-money-bill-wave"></i> Payroll Report</h3>
          <p style={{ margin: '1rem 0', opacity: 0.9 }}>Detailed payroll breakdown and summaries</p>
          <button className="btn" style={{ backgroundColor: 'white', color: '#43e97b' }} disabled={loading}>Generate Report</button>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', cursor: 'pointer' }} onClick={() => !loading && generateReport('demographics')}>
          <h3><i className="fas fa-users"></i> Employee Demographics</h3>
          <p style={{ margin: '1rem 0', opacity: 0.9 }}>Workforce composition and statistics</p>
          <button className="btn" style={{ backgroundColor: 'white', color: '#fa709a' }} disabled={loading}>Generate Report</button>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', cursor: 'pointer' }} onClick={() => !loading && generateReport('recruitment')}>
          <h3><i className="fas fa-bullseye"></i> Recruitment Report</h3>
          <p style={{ margin: '1rem 0', opacity: 0.9 }}>Hiring metrics and candidate pipeline</p>
          <button className="btn" style={{ backgroundColor: 'white', color: '#4facfe' }} disabled={loading}>Generate Report</button>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#1f2937', cursor: 'pointer' }} onClick={() => !loading && generateReport('employee')}>
          <h3><i className="fas fa-chart-line"></i> Employee Report</h3>
          <p style={{ margin: '1rem 0', opacity: 0.8 }}>Complete employee information analysis</p>
          <button className="btn btn-primary" disabled={loading}>Generate Report</button>
        </div>
      </div>

      {/* Generated Report Display */}
      {renderReportData()}

      {/* Quick Stats */}
      {!reportData && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Report Features</h3>
          <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}><i className="fas fa-chart-bar"></i></div>
              <p><strong>Real-time Data</strong></p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>All reports fetch live data from the database</p>
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}><i className="fas fa-download"></i></div>
              <p><strong>Export Options</strong></p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Download reports in CSV or JSON format</p>
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}><i className="fas fa-filter"></i></div>
              <p><strong>Advanced Filters</strong></p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Filter by date, department, employee and more</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
