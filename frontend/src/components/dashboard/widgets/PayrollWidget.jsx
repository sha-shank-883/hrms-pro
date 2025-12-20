import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, LineChart, Line
} from 'recharts';
import { FaMoneyBillWave, FaFilter } from 'react-icons/fa';
import { reportService, departmentService } from '../../../services';

const PayrollWidget = React.memo(({ chartType = 'bar', onToggle, currencySymbol = '$', onSettingsClick, isSettingsOpen }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        department_id: ''
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
                console.error("PayrollWidget: Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await reportService.getPayrollTrends(filters);
            if (response.data && response.data.monthly_trends) {
                // Ensure numeric values
                const processedData = response.data.monthly_trends.map(item => ({
                    ...item,
                    total_payroll: parseFloat(item.total_payroll) || 0
                }));
                setData(processedData);
            }
        } catch (error) {
            console.error("Failed to fetch payroll trends", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const hasData = data && data.length > 0;

    return (
        <div className="card flex flex-col h-full">
            {/* Header */}
            <div className="card-header">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                            <FaMoneyBillWave size={12} />
                        </div>
                        <h3 className="card-title text-sm uppercase tracking-wide">Payroll Analysis</h3>
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
                            <label>Year</label>
                            <input
                                type="number"
                                name="year"
                                value={filters.year}
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
                                    <option key={dept.department_id} value={dept.department_id}>
                                        {dept.department_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button
                            className="btn-sm btn-outline"
                            onClick={() => {
                                setFilters({ year: new Date().getFullYear(), department_id: '' });
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
                        <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#6366F1', fontWeight: 500 }}>Updating...</span>
                    </div>
                )}

                {!loading && !hasData && (
                    <div className="loading-overlay" style={{ background: 'white' }}>
                        <span style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>No payroll data available</span>
                    </div>
                )}

                {hasData && (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' && (
                            <BarChart data={data} barSize={32} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <Bar dataKey="total_payroll" name="Total Payroll" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                        {chartType === 'line' && (
                            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <Line type="monotone" dataKey="total_payroll" name="Total Payroll" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        )}
                        {chartType === 'area' && (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <Area type="monotone" dataKey="total_payroll" name="Total Payroll" stroke="#6366f1" fillOpacity={1} fill="url(#colorPayroll)" />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
});

export default PayrollWidget;
