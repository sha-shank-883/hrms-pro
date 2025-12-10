import React, { useEffect, useState } from 'react';
import { reportService } from '../services';
import { useSettings } from '../hooks/useSettings.jsx';
import { useAuth } from '../context/AuthContext';

const Analytics = () => {
  const { getSetting } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('turnover');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Analytics page loaded. User:', user);
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    console.log('Loading data for tab:', activeTab, 'User role:', user?.role);
    
    // Check if user has proper role
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      setError('Access denied. Only admins and managers can view analytics.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let response;
      switch(activeTab) {
        case 'turnover':
          console.log('Fetching turnover prediction data...');
          response = await reportService.getTurnoverPrediction();
          break;
        case 'performance':
          console.log('Fetching performance analytics data...');
          response = await reportService.getPerformanceAnalytics();
          break;
        case 'payroll':
          console.log('Fetching payroll trends data...');
          response = await reportService.getPayrollTrends();
          break;
        default:
          throw new Error('Invalid tab');
      }
      console.log('Data loaded successfully:', response);
      setData(response.data);
    } catch (error) {
      console.error('Analytics load error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load data';
      setError(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${activeTab}_${new Date().toISOString()}.${format}`;
    a.click();
  };

  // Render turnover prediction analytics
  const renderTurnoverAnalytics = () => {
    if (!data.turnover_history) return null;

    const maxTerminations = Math.max(...data.turnover_history.map(item => parseInt(item.terminations) || 0), 1);
    
    return (
      <div>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Turnover Predictions</h3>
          <div className="grid grid-cols-3" style={{ gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                {data.predictions?.predicted_next_quarter_turnover || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Predicted Q4 Turnover</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                {data.predictions?.predicted_turnover_rate || '0%'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Turnover Rate</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                {data.predictions?.total_active_employees || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Active Employees</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Historical Turnover Trend</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '20px 0' }}>
            {data.turnover_history.map((item, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${(parseInt(item.terminations) / maxTerminations) * 250 || 0}px`, 
                    backgroundColor: '#ef4444',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
                <span style={{ fontSize: '0.75rem', marginTop: '8px', color: '#64748b' }}>
                  {item.month}/{item.year?.toString().slice(-2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {data.risk_factors && data.risk_factors.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3>Department Risk Factors</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employees</th>
                    <th>Terminations</th>
                    <th>Turnover Rate</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {data.risk_factors.map((dept, index) => (
                    <tr key={index}>
                      <td>{dept.department_name}</td>
                      <td>{dept.total_employees}</td>
                      <td>{dept.terminated_count}</td>
                      <td>{dept.turnover_rate}%</td>
                      <td>
                        <span className={`badge badge-${
                          dept.risk_level === 'High' ? 'danger' : 
                          dept.risk_level === 'Medium' ? 'warning' : 'success'
                        }`}>
                          {dept.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render performance analytics
  const renderPerformanceAnalytics = () => {
    if (!data.task_completion_by_department) return null;

    return (
      <div>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Performance Overview</h3>
          <div className="grid grid-cols-3" style={{ gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                {data.overall_productivity || 0}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Overall Productivity</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                {data.high_performers_count || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>High Performers</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {data.top_performers?.length || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Top Performers</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
          <div className="card">
            <h3>Task Completion by Department</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {data.task_completion_by_department.map((dept, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>{dept.department_name}</span>
                    <span>{dept.completion_rate}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${dept.completion_rate}%`, 
                        height: '100%', 
                        backgroundColor: dept.completion_rate > 80 ? '#10b981' : dept.completion_rate > 60 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {dept.completed_tasks} of {dept.total_tasks} tasks completed
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.top_performers && data.top_performers.length > 0 && (
            <div className="card">
              <h3>Top Performers</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {data.top_performers.map((employee, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{employee.employee_name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{employee.department_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>{employee.productivity_score}%</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {employee.tasks_completed}/{employee.tasks_assigned} tasks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render payroll trends
  const renderPayrollAnalytics = () => {
    if (!data.monthly_trends) return null;

    const maxPayroll = Math.max(...data.monthly_trends.map(item => parseFloat(item.total_payroll) || 0), 1);
    
    return (
      <div>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Payroll Insights</h3>
          <div className="grid grid-cols-3" style={{ gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                {getSetting('currency_symbol', '$')}{data.salary_growth?.current_month_avg?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Current Avg Salary</div>
              <div style={{ fontSize: '0.75rem', color: data.salary_growth?.growth_rate?.includes('-') ? '#ef4444' : '#10b981', marginTop: '0.25rem' }}>
                {data.salary_growth?.growth_rate || '0%'} from last month
              </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                {data.monthly_trends.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Months Analyzed</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {data.department_salary_distribution?.length || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Departments</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Monthly Payroll Trends</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '20px 0' }}>
            {data.monthly_trends.map((item, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${(parseFloat(item.total_payroll) / maxPayroll) * 250 || 0}px`, 
                    backgroundColor: '#10b981',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
                <span style={{ fontSize: '0.75rem', marginTop: '8px', color: '#64748b' }}>
                  {item.month}/{item.year?.toString().slice(-2)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            Total Payroll: {getSetting('currency_symbol', '$')}
            {data.monthly_trends.reduce((sum, item) => sum + (parseFloat(item.total_payroll) || 0), 0).toLocaleString()}
          </div>
        </div>

        {data.department_salary_distribution && data.department_salary_distribution.length > 0 && (
          <div className="card">
            <h3>Department Salary Distribution</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employees</th>
                    <th>Avg Salary</th>
                    <th>Min Salary</th>
                    <th>Max Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {data.department_salary_distribution.map((dept, index) => (
                    <tr key={index}>
                      <td>{dept.department_name}</td>
                      <td>{dept.employee_count}</td>
                      <td>{getSetting('currency_symbol', '$')}{parseFloat(dept.avg_salary).toLocaleString()}</td>
                      <td>{getSetting('currency_symbol', '$')}{parseFloat(dept.min_salary).toLocaleString()}</td>
                      <td>{getSetting('currency_symbol', '$')}{parseFloat(dept.max_salary).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1><i className="fas fa-chart-line"></i> Advanced Analytics</h1>
        <div>
          {data && Object.keys(data).length > 0 && (
            <button className="btn btn-primary" onClick={() => exportData('json')}>
              Export Data
            </button>
          )}
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}
      
      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              <button
                className={`btn ${activeTab === 'turnover' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('turnover')}
                style={{ 
                  marginRight: '0.5rem', 
                  borderBottom: activeTab === 'turnover' ? '2px solid #3b82f6' : 'none',
                  borderRadius: '0.375rem 0.375rem 0 0'
                }}
              >
                <i className="fas fa-crystal-ball"></i> Turnover Prediction
              </button>
              <button
                className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('performance')}
                style={{ 
                  marginRight: '0.5rem', 
                  borderBottom: activeTab === 'performance' ? '2px solid #3b82f6' : 'none',
                  borderRadius: '0.375rem 0.375rem 0 0'
                }}
              >
                <i className="fas fa-bullseye"></i> Performance Analytics
              </button>
              <button
                className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('payroll')}
                style={{ 
                  borderBottom: activeTab === 'payroll' ? '2px solid #3b82f6' : 'none',
                  borderRadius: '0.375rem 0.375rem 0 0'
                }}
              >
                <i className="fas fa-money-bill-wave"></i> Payroll Trends
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'turnover' && renderTurnoverAnalytics()}
          {activeTab === 'performance' && renderPerformanceAnalytics()}
          {activeTab === 'payroll' && renderPayrollAnalytics()}
        </>
      )}
    </div>
  );
};

export default Analytics;