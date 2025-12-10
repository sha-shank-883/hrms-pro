import React, { useState, useEffect } from 'react';
import { reportService, departmentService } from '../services';
import '../styles/global.css';
import './ChurnRiskReport.css';
import { FaExclamationTriangle, FaUserClock, FaChartLine, FaCalendarTimes } from 'react-icons/fa';

const ChurnRiskReport = () => {
    const [data, setData] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        department_id: '',
        risk_level: ''
    });

    useEffect(() => {
        fetchDepartments();
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filters.department_id]);

    const fetchDepartments = async () => {
        try {
            const response = await departmentService.getAll();
            setDepartments(response.data || response || []);
        } catch (err) {
            console.error('Failed to fetch departments', err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await reportService.getChurnRiskAnalysis({
                department_id: filters.department_id
            });
            setData(response.data || response || []);
        } catch (err) {
            console.error('Failed to fetch churn risk data', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (score) => {
        if (score >= 70) return '#ef4444'; // Red
        if (score >= 30) return '#f59e0b'; // Amber
        return '#10b981'; // Green
    };

    const getRiskBadgeColor = (level) => {
        switch (level) {
            case 'High': return 'danger';
            case 'Medium': return 'warning';
            default: return 'success';
        }
    };

    const filteredData = data.filter(item => {
        if (filters.risk_level && item.riskLevel !== filters.risk_level) return false;
        return true;
    });

    return (
        <div className="churn-report-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaChartLine size={24} color="var(--primary-color)" />
                    <div>
                        <h1 className="page-title">Churn Risk Analysis <span style={{ fontSize: '0.8rem', verticalAlign: 'middle' }} className="badge badge-info">BETA</span></h1>
                        <p className="page-description">
                            AI-driven insights to identify retention risks based on tenure, performance, and attendance patterns.
                        </p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="churn-filter-bar">
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                        <label className="form-label">Department</label>
                        <select
                            className="form-input"
                            value={filters.department_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, department_id: e.target.value }))}
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                        <label className="form-label">Risk Level</label>
                        <select
                            className="form-input"
                            value={filters.risk_level}
                            onChange={(e) => setFilters(prev => ({ ...prev, risk_level: e.target.value }))}
                        >
                            <option value="">All Levels</option>
                            <option value="High">High Risk</option>
                            <option value="Medium">Medium Risk</option>
                            <option value="Low">Low Risk</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading">Analyzing employee data...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '1.5rem' }}>Employee</th>
                                <th>Risk Assessment</th>
                                <th>Risk Factors</th>
                                <th>Key Metrics</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map(item => (
                                    <tr key={item.employee_id} className={item.riskLevel === 'High' ? 'table-row-high-risk' : ''}>
                                        <td style={{ paddingLeft: '1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.first_name} {item.last_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.department_name}</div>
                                        </td>
                                        <td>
                                            <div className="risk-score-cell">
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: getRiskColor(item.riskScore), minWidth: '40px' }}>
                                                    {item.riskScore}%
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div className="risk-progress-bar">
                                                        <div
                                                            className="risk-progress-fill"
                                                            style={{
                                                                width: `${item.riskScore}%`,
                                                                backgroundColor: getRiskColor(item.riskScore)
                                                            }}
                                                        />
                                                    </div>
                                                    <span className={`badge badge-${getRiskBadgeColor(item.riskLevel)}`} style={{ alignSelf: 'flex-start' }}>
                                                        {item.riskLevel} Risk
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '300px' }}>
                                                {item.factors.length > 0 ? (
                                                    item.factors.map((factor, idx) => (
                                                        <span key={idx} className="risk-factor-tag">
                                                            <FaExclamationTriangle size={10} style={{ marginRight: '4px', color: '#ef4444' }} />
                                                            {factor}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic' }}>No significant risk factors</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="risk-metric">
                                                <div className="risk-metric-item" title="Tenure">
                                                    <span className="risk-metric-label"><FaUserClock /> Tenure</span>
                                                    <span className="risk-metric-value">{item.metrics.tenureMonths} mo</span>
                                                </div>
                                                <div className="risk-metric-item" title="Avg Performance Rating">
                                                    <span className="risk-metric-label"><FaChartLine /> Perf</span>
                                                    <span className="risk-metric-value">{item.metrics.avgRating || 'N/A'}</span>
                                                </div>
                                                <div className="risk-metric-item" title="Absent Days (Last 30d)">
                                                    <span className="risk-metric-label"><FaCalendarTimes /> Absent</span>
                                                    <span className="risk-metric-value">{item.metrics.absentDays}d</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="empty-state">
                                        <div className="empty-state-icon">🎉</div>
                                        <div className="empty-state-title">No At-Risk Employees Found</div>
                                        <div className="empty-state-description">Try adjusting your filters to see more results.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ChurnRiskReport;
