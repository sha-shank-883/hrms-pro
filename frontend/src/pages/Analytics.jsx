import React, { useEffect, useState } from 'react';
import { reportService, aiIntelligenceService } from '../services';
import { useSettings } from '../hooks/useSettings.jsx';
import { useAuth } from '../context/AuthContext';
import AIModal from '../components/ai/AIModal';
import { FaRobot, FaMagic, FaCheckCircle, FaLightbulb, FaChartLine } from 'react-icons/fa';
import { FiTrendingUp, FiTarget, FiActivity } from 'react-icons/fi';

const Analytics = () => {
  const { getSetting } = useSettings();
  const { user, hasModule } = useAuth();
  const [activeTab, setActiveTab] = useState('turnover');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Executive Insights State
  const [showAiInsightsModal, setShowAiInsightsModal] = useState(false);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState('');
  const [aiInsightsResult, setAiInsightsResult] = useState(null);

  const handleGenerateExecutiveInsights = async () => {
    setShowAiInsightsModal(true);
    setAiInsightsLoading(true);
    setAiInsightsError('');
    setAiInsightsResult(null);

    try {
      const res = await aiIntelligenceService.generateExecutiveInsights();
      setAiInsightsResult(res.data);
    } catch (err) {
      setAiInsightsError(err.response?.data?.message || err.message || 'Failed to generate AI executive insights');
    } finally {
      setAiInsightsLoading(false);
    }
  };

  useEffect(() => {
    
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    // 

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
      switch (activeTab) {
        case 'turnover':
          // 
          response = await reportService.getTurnoverPrediction();
          break;
        case 'performance':
          // 
          response = await reportService.getPerformanceAnalytics();
          break;
        case 'payroll':
          // 
          response = await reportService.getPayrollTrends();
          break;
        default:
          throw new Error('Invalid tab');
      }
      // 
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
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Turnover Predictions</h3>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {data.predictions?.predicted_next_quarter_turnover || 0}
              </div>
              <div className="text-sm text-neutral-500 font-medium">Predicted Q4 Turnover</div>
            </div>
            <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
              <div className="text-3xl font-bold text-sky-600 mb-1">
                {data.predictions?.predicted_turnover_rate || '0%'}
              </div>
              <div className="text-sm text-neutral-500 font-medium">Turnover Rate</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {data.predictions?.total_active_employees || 0}
              </div>
              <div className="text-sm text-neutral-500 font-medium">Active Employees</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Historical Turnover Trend</h3>
          </div>
          <div className="h-64 flex items-end gap-2 px-4 pb-2">
            {data.turnover_history.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div
                  className="w-full bg-red-400 rounded-t transition-all duration-300 group-hover:bg-red-500 relative"
                  style={{
                    height: `${(parseInt(item.terminations) / maxTerminations) * 200 || 0}px`,
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.terminations} terminations
                  </div>
                </div>
                <span className="text-xs mt-2 text-neutral-500 font-medium">
                  {item.month}/{item.year?.toString().slice(-2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {data.risk_factors && data.risk_factors.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Department Risk Factors</h3>
            </div>
            <div className="table-container border-0 shadow-none">
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
                      <td className="font-medium text-neutral-900">{dept.department_name}</td>
                      <td>{dept.total_employees}</td>
                      <td>{dept.terminated_count}</td>
                      <td>{dept.turnover_rate}%</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dept.risk_level === 'High' ? 'bg-red-100 text-red-800' :
                            dept.risk_level === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
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
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance Overview</h3>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
              <div className="text-3xl font-bold text-sky-600 mb-1">
                {data.overall_productivity || 0}%
              </div>
              <div className="text-sm text-neutral-500 font-medium">Overall Productivity</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {data.high_performers_count || 0}
              </div>
              <div className="text-sm text-neutral-500 font-medium">High Performers</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {data.top_performers?.length || 0}
              </div>
              <div className="text-sm text-neutral-500 font-medium">Top Performers</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="card h-full">
            <div className="card-header">
              <h3 className="card-title">Task Completion by Department</h3>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {data.task_completion_by_department.map((dept, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700">{dept.department_name}</span>
                    <span className="text-sm font-bold text-neutral-900">{dept.completion_rate}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${dept.completion_rate > 80 ? 'bg-emerald-500' : dept.completion_rate > 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${dept.completion_rate}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {dept.completed_tasks} of {dept.total_tasks} tasks completed
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.top_performers && data.top_performers.length > 0 && (
            <div className="card h-full">
              <div className="card-header">
                <h3 className="card-title">Top Performers</h3>
              </div>
              <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {data.top_performers.map((employee, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 px-2 rounded transition-colors">
                    <div>
                      <div className="font-semibold text-neutral-900">{employee.employee_name}</div>
                      <div className="text-xs text-neutral-500">{employee.department_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{employee.productivity_score}%</div>
                      <div className="text-xs text-neutral-500">
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
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payroll Insights</h3>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
              <div className="text-3xl font-bold text-sky-600 mb-1">
                {getSetting('currency_symbol', '$')}{data.salary_growth?.current_month_avg?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-neutral-500 font-medium">Current Avg Salary</div>
              <div className={`text-xs mt-1 font-medium ${data.salary_growth?.growth_rate?.includes('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                {data.salary_growth?.growth_rate || '0%'} from last month
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {data.monthly_trends.length}
              </div>
              <div className="text-sm text-neutral-500 font-medium">Months Analyzed</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {data.department_salary_distribution?.length || 0}
              </div>
              <div className="text-sm text-neutral-500 font-medium">Departments</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Payroll Trends</h3>
          </div>
          <div className="h-64 flex items-end gap-2 px-4 pb-2">
            {data.monthly_trends.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div
                  className="w-full bg-emerald-400 rounded-t transition-all duration-300 group-hover:bg-emerald-500 relative"
                  style={{
                    height: `${(parseFloat(item.total_payroll) / maxPayroll) * 200 || 0}px`,
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {getSetting('currency_symbol', '$')}{parseFloat(item.total_payroll).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs mt-2 text-neutral-500 font-medium">
                  {item.month}/{item.year?.toString().slice(-2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-neutral-500 font-medium border-t border-neutral-100 pt-4">
            Total Payroll: {getSetting('currency_symbol', '$')}
            {data.monthly_trends.reduce((sum, item) => sum + (parseFloat(item.total_payroll) || 0), 0).toLocaleString()}
          </div>
        </div>

        {data.department_salary_distribution && data.department_salary_distribution.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Department Salary Distribution</h3>
            </div>
            <div className="table-container border-0 shadow-none">
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
                      <td className="font-semibold text-neutral-900">{dept.department_name}</td>
                      <td>{dept.employee_count}</td>
                      <td className="font-mono text-sm">{getSetting('currency_symbol', '$')}{parseFloat(dept.avg_salary).toLocaleString()}</td>
                      <td className="font-mono text-sm text-neutral-500">{getSetting('currency_symbol', '$')}{parseFloat(dept.min_salary).toLocaleString()}</td>
                      <td className="font-mono text-sm text-neutral-500">{getSetting('currency_symbol', '$')}{parseFloat(dept.max_salary).toLocaleString()}</td>
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
    <div className="w-full pb-8">
      <div className="page-header flex items-center justify-between">
        <h1 className="page-title flex items-center"><FaChartLine className="mr-2 text-primary-600" /> Advanced Analytics</h1>
        <div className="flex items-center gap-2">
          {hasModule('ai_assistant') && (
            <button
              type="button"
              className="btn btn-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold flex items-center gap-1.5 shadow-sm px-3.5 py-2 rounded-xl text-xs border-none transition-all"
              onClick={handleGenerateExecutiveInsights}
              title="Generate C-suite strategic analysis of workforce productivity & costs"
            >
              <FaRobot size={13} /> AI Executive Strategic Briefing
            </button>
          )}
          {data && Object.keys(data).length > 0 && (
            <button className="btn btn-primary" onClick={() => exportData('json')}>
              Export Data
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 flex items-center">
          <i className="fas fa-exclamation-circle mr-2"></i> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-200 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'turnover' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              onClick={() => setActiveTab('turnover')}
            >
              <div className="flex items-center gap-2">
                <i className="fas fa-crystal-ball"></i> Turnover Prediction
              </div>
              {activeTab === 'turnover' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'performance' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              onClick={() => setActiveTab('performance')}
            >
              <div className="flex items-center gap-2">
                <i className="fas fa-bullseye"></i> Performance Analytics
              </div>
              {activeTab === 'performance' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'payroll' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              onClick={() => setActiveTab('payroll')}
            >
              <div className="flex items-center gap-2">
                <i className="fas fa-money-bill-wave"></i> Payroll Trends
              </div>
              {activeTab === 'payroll' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'turnover' && renderTurnoverAnalytics()}
          {activeTab === 'performance' && renderPerformanceAnalytics()}
          {activeTab === 'payroll' && renderPayrollAnalytics()}
        </>
      )}

      {/* AI Executive Workforce & Productivity Insights Modal */}
      <AIModal
        isOpen={showAiInsightsModal}
        onClose={() => setShowAiInsightsModal(false)}
        title="AI Executive Workforce & Strategic Briefing"
        subtitle="Cross-departmental productivity, payroll efficiency, and organizational health"
        loading={aiInsightsLoading}
        loadingText="Analyzing headcount trends, task velocity, and payroll ratios..."
        error={aiInsightsError}
        onRetry={handleGenerateExecutiveInsights}
      >
        {aiInsightsResult && (
          <div className="space-y-4 text-xs">
            {/* Health Score Header */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Workforce Health Index</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {aiInsightsResult.workforce_health_score} <span className="text-sm font-normal text-slate-400">/ 100</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Strong Momentum
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Report Level</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">C-Suite Executive</span>
              </div>
            </div>

            {/* Executive Headline */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Executive Summary:</span>
              <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 mb-1">{aiInsightsResult.executive_headline}</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{aiInsightsResult.productivity_analysis}</p>
            </div>

            {/* Cost vs Output Commentary */}
            {aiInsightsResult.cost_vs_output_commentary && (
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                  <FiTrendingUp className="text-emerald-600" /> Payroll & Cost-to-Output Dynamics
                </span>
                <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">{aiInsightsResult.cost_vs_output_commentary}</p>
              </div>
            )}

            {/* Strategic Recommendations */}
            {aiInsightsResult.strategic_recommendations?.length > 0 && (
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-2">
                  <FiTarget className="text-indigo-600" /> C-Suite Strategic Action Points
                </span>
                <ol className="space-y-1.5 pl-4 list-decimal text-slate-700 dark:text-slate-300">
                  {aiInsightsResult.strategic_recommendations.map((rec, i) => (
                    <li key={i} className="pl-1 leading-relaxed font-medium">{rec}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </AIModal>
    </div>
  );
};

export default Analytics;