import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { FaCalendarCheck, FaFilter } from 'react-icons/fa';
import { reportService, departmentService } from '../../../services';

const AttendanceWidget = React.memo(({ chartType = 'area', onToggle, onSettingsClick, isSettingsOpen }) => {
    const [data, setData] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        department_id: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filters]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await departmentService.getAll();
                // Check if response is array or object with data property
                // departmentService.getAll() returns response.data directly based on service definition
                // but let's be safe
                if (Array.isArray(response)) {
                    setDepartments(response);
                } else if (response.data && Array.isArray(response.data)) {
                    setDepartments(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAttendanceTrends(filters);
            if (response.data) {
                setData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch attendance trends", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Helper to determine if we have any data to show
    const hasData = data && data.length > 0;

    return (
        <div className="card flex flex-col h-full">
            {/* Header */}
            <div className="card-header">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                            <FaCalendarCheck size={12} />
                        </div>
                        <h3 className="card-title text-sm uppercase tracking-wide">Attendance Trends</h3>
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
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={filters.start_date}
                                onChange={handleFilterChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={filters.end_date}
                                onChange={handleFilterChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <select
                                name="department_id"
                                value={filters.department_id}
                                onChange={handleFilterChange}
                                className="form-input"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-actions">
                            <button
                                className="btn-sm btn-outline"
                                onClick={() => {
                                    setFilters({ start_date: '', end_date: '', department_id: '' });
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
                </div>
            )}

            {/* Chart Area */}
            <div className="chart-container">
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#10B981', fontWeight: 500 }}>Updating...</span>
                    </div>
                )}

                {!loading && !hasData && (
                    <div className="loading-overlay" style={{ background: 'white' }}>
                        <span style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>No data available</span>
                    </div>
                )}

                {hasData && (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'area' && (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#4B5563', marginLeft: '4px' }}>{value}</span>} />
                                <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                                <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAbsent)" name="Absent" />
                            </AreaChart>
                        )}
                        {chartType === 'bar' && (
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#4B5563', marginLeft: '4px' }}>{value}</span>} />
                                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                        {chartType === 'line' && (
                            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#4B5563', marginLeft: '4px' }}>{value}</span>} />
                                <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
});

export default AttendanceWidget;
