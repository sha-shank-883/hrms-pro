import React, { useState, useEffect, memo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { FaFilter } from 'react-icons/fa';
import ChartToggle from './ChartToggle';
import { leaveService, departmentService } from '../../../services';

const LeaveWidget = memo(({ chartType, onToggle, onSettingsClick, isSettingsOpen }) => {
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        departmentId: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await departmentService.getAll();
                if (Array.isArray(response)) {
                    setDepartments(response);
                } else if (response.data && Array.isArray(response.data)) {
                    setDepartments(response.data);
                }
            } catch (error) {
                console.error("LeaveWidget: Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Assuming getStatistics accepts params, if not frontend filters
                const response = await leaveService.getStatistics(filters);

                // Handle response format variations
                const data = response.data || response;

                // Match backend response structure (pending_requests, etc.)
                const leavesStats = data.leaves || data;

                setStats({
                    pending: parseInt(leavesStats.pending_requests || 0),
                    approved: parseInt(leavesStats.approved_requests || 0),
                    rejected: parseInt(leavesStats.rejected_requests || 0)
                });
            } catch (error) {
                console.error("LeaveWidget: Failed to fetch statistics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const leaveData = [
        { name: 'Pending', value: stats.pending },
        { name: 'Approved', value: stats.approved },
        { name: 'Rejected', value: stats.rejected }
    ];

    const hasData = leaveData.some(d => d.value > 0);

    return (
        <div className="card flex flex-col h-full">
            <div className="card-header">
                <div>
                    <div className="flex items-center gap-sm">
                        <div className="widget-icon-container bg-warning-50 text-warning">
                            <FaFilter size={12} />
                        </div>
                        <h3 className="card-title text-sm uppercase tracking-wide">Leave Distribution</h3>
                    </div>
                </div>
                <div className="widget-actions">
                    <button
                        className={`btn-icon-only ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        title="Filter Data"
                    >
                        <FaFilter size={12} />
                    </button>
                    <button
                        className={`btn-icon-only ${isSettingsOpen ? 'active' : ''}`}
                        onClick={onSettingsClick}
                        title="Widget Settings"
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            {/* Filter Popup */}
            {showFilters && (
                <div className="filter-popup">
                    <div className="filter-header">
                        <h4>Filter Data</h4>
                        <button onClick={() => setShowFilters(false)} className="filter-close">&times;</button>
                    </div>

                    <div className="filter-body">
                        <div className="form-group">
                            <label>Date Range</label>
                            <div className="settings-grid-2">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                />
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Department</label>
                            <select
                                name="departmentId"
                                value={filters.departmentId}
                                onChange={handleFilterChange}
                                className="form-input"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.department_id} value={dept.department_id}>
                                        {dept.department_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-actions">
                            <button
                                className="btn-sm btn-outline"
                                onClick={() => {
                                    setFilters({ startDate: '', endDate: '', departmentId: '' });
                                    setShowFilters(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-sm btn-primary-sm"
                                onClick={() => setShowFilters(false)}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="chart-container">
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#6366F1', fontWeight: 500 }}>Updating...</span>
                    </div>
                )}

                {!loading && !hasData && (
                    <div className="loading-overlay" style={{ background: 'transparent' }}>
                        <p className="widget-subtitle">No data available</p>
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    {(chartType === 'pie' || chartType === 'donut') && (
                        <PieChart>
                            <Pie
                                data={leaveData}
                                cx="50%"
                                cy="50%"
                                innerRadius={chartType === 'donut' ? 60 : 0}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                stroke="none"
                                paddingAngle={chartType === 'donut' ? 4 : 0}
                            >
                                <Cell key="cell-0" fill="#f59e0b" /> {/* Pending */}
                                <Cell key="cell-1" fill="#10b981" /> {/* Approved */}
                                <Cell key="cell-2" fill="#ef4444" /> {/* Rejected */}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Legend iconType="circle" />
                        </PieChart>
                    )}
                    {chartType === 'bar' && (
                        <BarChart data={leaveData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {leaveData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981', '#ef4444'][index]} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
});

export default LeaveWidget;
