import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaTasks, FaFilter } from 'react-icons/fa';
import { reportService, departmentService } from '../../../services';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

import { useSocket } from '../../../context/SocketContext';

const TaskWidget = React.memo(({ chartType = 'pie', onToggle, onSettingsClick, isSettingsOpen }) => {
    const { socket } = useSocket();
    const [data, setData] = useState({
        statusDistribution: [],
        completionByDept: []
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
                console.error("TaskWidget: Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchData();

        if (socket) {
            const handleTaskUpdate = () => fetchData();
            socket.on('task_created', handleTaskUpdate);
            socket.on('task_updated', handleTaskUpdate);
            socket.on('task_deleted', handleTaskUpdate);

            return () => {
                socket.off('task_created', handleTaskUpdate);
                socket.off('task_updated', handleTaskUpdate);
                socket.off('task_deleted', handleTaskUpdate);
            };
        }
    }, [filters, socket]);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log("TaskWidget: Fetching data with filters:", filters);
            const response = await reportService.getPerformanceAnalytics(filters);
            console.log("TaskWidget: API Response:", response);

            if (response.data) {
                // Ensure numbers are numbers (Postgres returns strings for counts)
                const statusDistribution = (response.data.task_status_distribution || []).map(item => ({
                    ...item,
                    count: parseInt(item.count, 10) || 0
                }));

                const completionByDept = (response.data.task_completion_by_department || []).map(item => ({
                    ...item,
                    completion_rate: parseFloat(item.completion_rate) || 0,
                    total_tasks: parseInt(item.total_tasks, 10) || 0
                }));

                const newData = {
                    statusDistribution,
                    completionByDept
                };
                console.log("TaskWidget: Setting sanitized data:", newData);
                setData(newData);
            } else {
                console.warn("TaskWidget: No data in response");
            }
        } catch (error) {
            console.error("TaskWidget: Failed to fetch task analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Helper to determine if we have any data to show
    const hasData = data.statusDistribution.length > 0 || data.completionByDept.length > 0;

    return (
        <div className="card flex flex-col h-full">
            <div className="card-header">
                <div>
                    <div className="flex items-center gap-sm">
                        <div className="widget-icon-container bg-primary-50 text-action-primary">
                            <FaTasks size={12} style={{ color: "var(--primary-600)" }} />
                        </div>
                        <h3 className="card-title text-sm uppercase tracking-wide">Task Analytics</h3>
                    </div>
                </div>

                <div className="flex items-center gap-sm">
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

                        <div className="form-group">
                            <label>Advanced Filters</label>
                            <div className="settings-grid-2">
                                <select
                                    name="priority"
                                    value={filters.priority || ''}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                >
                                    <option value="">Priority (All)</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                                <select
                                    name="status"
                                    value={filters.status || ''}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                >
                                    <option value="">Status (All)</option>
                                    <option value="todo">Todo</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button
                            className="btn-sm btn-outline"
                            onClick={() => {
                                setFilters({ startDate: '', endDate: '', departmentId: '', priority: '', status: '' });
                                setShowFilters(false);
                            }}
                        >
                            Reset
                        </button>
                        <button
                            className="btn-sm btn-primary-sm"
                            onClick={() => setShowFilters(false)}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Chart Area */}
            <div className="chart-container">
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#4F46E5', fontWeight: 500 }}>Updating...</span>
                    </div>
                )}

                {!loading && !hasData && (
                    <div className="loading-overlay" style={{ background: 'white' }}>
                        <span style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>No data available</span>
                        <span style={{ fontSize: '0.75rem', color: '#D1D5DB' }}>Try adjusting filters or creating tasks</span>
                    </div>
                )}

                {hasData && (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'pie' ? (
                            <PieChart>
                                <Pie
                                    data={data.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="count"
                                    nameKey="status"
                                    stroke="none"
                                >
                                    {data.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#4B5563', marginLeft: '4px' }}>{value}</span>}
                                />
                            </PieChart>
                        ) : (
                            <BarChart data={data.completionByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                <XAxis
                                    dataKey="department_name"
                                    tick={{ fill: '#6B7280', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                />
                                <YAxis
                                    tick={{ fill: '#6B7280', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6', opacity: 0.6 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                />
                                <Bar
                                    dataKey="completion_rate"
                                    name="Completion Rate %"
                                    fill="#6366F1"
                                    radius={[4, 4, 0, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
});

export default TaskWidget;
