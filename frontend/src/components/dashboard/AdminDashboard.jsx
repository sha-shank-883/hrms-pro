import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services';
import { useSettings } from '../../hooks/useSettings.jsx';
import { formatDate } from '../../utils/settingsHelper';
import {
    FaUsers,
    FaBuilding,
    FaClock,
    FaCalendarAlt,
    FaTasks,
    FaMoneyBillWave,
    FaUserPlus,
    FaBullhorn,
    FaChartBar
} from 'react-icons/fa';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadDashboardStats();
        loadAdvancedAnalytics();

        // Update time every second
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const loadDashboardStats = async () => {
        try {
            const response = await reportService.getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAdvancedAnalytics = async () => {
        try {
            // Load predictive analytics
            const [turnoverData, performanceData, payrollTrends] = await Promise.all([
                reportService.getTurnoverPrediction(),
                reportService.getPerformanceAnalytics(),
                reportService.getPayrollTrends()
            ]);

            setAnalytics({
                turnover: turnoverData.data,
                performance: performanceData.data,
                payroll: payrollTrends.data
            });
        } catch (error) {
            console.error('Failed to load advanced analytics:', error);
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Render a simple bar chart for turnover prediction
    const renderTurnoverChart = () => {
        if (!analytics?.turnover?.turnover_history || analytics.turnover.turnover_history.length === 0) return null;

        const maxTerminations = Math.max(...analytics.turnover.turnover_history.map(item => item.terminations));

        return (
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Turnover Trend (Last 12 Months)</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '4px', padding: '10px 0' }}>
                    {analytics.turnover.turnover_history.map((item, index) => (
                        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: '100%',
                                    height: `${(item.terminations / maxTerminations) * 80 || 0}px`,
                                    backgroundColor: '#ef4444',
                                    borderRadius: '2px'
                                }}
                            />
                            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>{item.month}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render performance metrics
    const renderPerformanceMetrics = () => {
        if (!analytics?.performance) return null;

        return (
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Performance Insights</h3>
                <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                            {analytics.performance.overall_productivity}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Avg Productivity</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                            {analytics.performance.high_performers_count}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>High Performers</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                            {analytics.performance.top_performers?.length || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Top Performers</div>
                    </div>
                </div>

                {analytics.performance.top_performers && analytics.performance.top_performers.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Top Performers</h4>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {analytics.performance.top_performers.slice(0, 5).map((employee, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                    <span>{employee.employee_name}</span>
                                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{employee.productivity_score}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render payroll trends
    const renderPayrollTrends = () => {
        if (!analytics?.payroll) return null;

        return (
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Payroll Insights</h3>
                <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                            {getSetting('currency_symbol', '$')}{analytics.payroll.salary_growth?.current_month_avg?.toLocaleString() || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Current Avg Salary</div>
                        <div style={{ fontSize: '0.75rem', color: analytics.payroll.salary_growth?.growth_rate?.includes('-') ? '#ef4444' : '#10b981', marginTop: '0.25rem' }}>
                            {analytics.payroll.salary_growth?.growth_rate || '0%'} from last month
                        </div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a' }}>
                            {analytics.payroll.department_salary_distribution?.length || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Departments Analyzed</div>
                    </div>
                </div>

                {analytics.payroll.department_salary_distribution && analytics.payroll.department_salary_distribution.length > 0 && (
                    <div>
                        <h4 style={{ marginBottom: '0.5rem' }}>Department Salary Distribution</h4>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {analytics.payroll.department_salary_distribution.map((dept, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                    <span>{dept.department_name}</span>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {getSetting('currency_symbol', '$')}{parseFloat(dept.avg_salary).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container">
            {/* Header with Time */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-description">Overview of organization performance and stats</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>{formatTime(currentTime)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(currentTime, getSetting('date_format'))}</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        padding: '1.25rem'
                    }}
                    onClick={() => navigate('/employees')}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaUsers /></div>
                    <h3 style={{ fontSize: '1.875rem', marginBottom: '0.25rem', fontWeight: '700' }}>{stats?.employees?.total || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Total Employees</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.5rem' }}>Active: {stats?.employees?.active || 0}</p>
                </div>

                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        padding: '1.25rem'
                    }}
                    onClick={() => navigate('/departments')}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(240, 147, 251, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaBuilding /></div>
                    <h3 style={{ fontSize: '1.875rem', marginBottom: '0.25rem', fontWeight: '700' }}>{stats?.departments?.total || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Departments</p>
                </div>

                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        padding: '1.25rem'
                    }}
                    onClick={() => navigate('/attendance')}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(79, 172, 254, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaClock /></div>
                    <h3 style={{ fontSize: '1.875rem', marginBottom: '0.25rem', fontWeight: '700' }}>{stats?.attendance?.present || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Present Today</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.5rem' }}>Absent: {stats?.attendance?.absent || 0}</p>
                </div>

                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        padding: '1.25rem'
                    }}
                    onClick={() => navigate('/leaves')}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(67, 233, 123, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaCalendarAlt /></div>
                    <h3 style={{ fontSize: '1.875rem', marginBottom: '0.25rem', fontWeight: '700' }}>{stats?.leaves?.pending || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Pending Leaves</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.5rem' }}>Approved: {stats?.leaves?.approved || 0}</p>
                </div>
            </div>

            {/* Predictive Analytics Section */}
            <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Turnover Prediction</h2>
                    </div>
                    {analytics?.turnover?.predictions ? (
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {analytics.turnover.predictions.predicted_next_quarter_turnover}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                                Predicted turnover next quarter
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                                Rate: {analytics.turnover.predictions.predicted_turnover_rate}
                            </p>
                        </div>
                    ) : (
                        <p style={{ margin: '1rem 0', opacity: 0.8 }}>Loading predictions...</p>
                    )}
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Performance Score</h2>
                    </div>
                    {analytics?.performance ? (
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {analytics.performance.overall_productivity}%
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                                Overall team productivity
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                                {analytics.performance.high_performers_count} high performers
                            </p>
                        </div>
                    ) : (
                        <p style={{ margin: '1rem 0', opacity: 0.8 }}>Loading performance data...</p>
                    )}
                </div>
            </div>

            {/* Turnover Chart */}
            {renderTurnoverChart()}

            {/* Performance Metrics */}
            {renderPerformanceMetrics()}

            {/* Payroll Trends */}
            {renderPayrollTrends()}

            {/* Stats Overview */}
            <div className="grid grid-cols-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Tasks Overview</h2>
                        <span style={{ fontSize: '1.25rem' }}><FaTasks /></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Total Tasks:</span>
                        <strong>{stats?.tasks?.total || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>To Do:</span>
                        <span className="badge badge-warning">{stats?.tasks?.todo || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>In Progress:</span>
                        <span className="badge badge-info">{stats?.tasks?.in_progress || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Completed:</span>
                        <span className="badge badge-success">{stats?.tasks?.completed || 0}</span>
                    </div>
                </div>

                <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/payroll')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Payroll Summary (This Month)</h2>
                        <span style={{ fontSize: '1.25rem' }}><FaMoneyBillWave /></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Total Amount:</span>
                        <strong>{getSetting('currency_symbol', '$')}{stats?.payroll?.total_amount?.toLocaleString() || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Paid:</span>
                        <span className="badge badge-success">{stats?.payroll?.paid || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Pending:</span>
                        <span className="badge badge-warning">{stats?.payroll?.pending || 0}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/employees')}
                    >
                        <FaUserPlus /> Add Employee
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/tasks')}
                    >
                        <FaTasks /> Create Task
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/payroll')}
                    >
                        <FaMoneyBillWave /> Process Payroll
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/recruitment')}
                    >
                        <FaBullhorn /> Post Job
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/reports')}
                    >
                        <FaChartBar /> Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
