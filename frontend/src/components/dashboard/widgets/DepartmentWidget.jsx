import React, { useState, useEffect, memo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import { FaBuilding, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ChartToggle from './ChartToggle';
import { reportService } from '../../../services';

const COLORS = ['#8cc63f', '#2c3e50', '#3498db', '#f39c12', '#e74c3c', '#9b59b6', '#34495e', '#95a5a6'];

const DepartmentWidget = memo(({ chartType, onToggle, onSettingsClick, isSettingsOpen }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await reportService.getEmployeeDemographics(filters);
            if (response.data) {
                const deptData = response.data.by_department || [];
                setData(deptData);
                // Calculate total from data if not provided directly
                const total = deptData.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
                setTotalEmployees(total || 1);
            }
        } catch (error) {
            console.error("DepartmentWidget: Failed to fetch demographics", error);
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
            <div className="card-header">
                <div>
                    <div className="flex items-center gap-sm">
                        <div className="widget-icon-container bg-success-50 text-success">
                            <FaBuilding size={12} />
                        </div>
                        <h3 className="card-title text-sm uppercase tracking-wide">Department Distribution</h3>
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
                    <button
                        onClick={() => navigate('/departments')}
                        className="btn btn-ghost btn-sm text-xs font-medium px-2 py-1 h-auto min-h-0"
                    >
                        Manage
                    </button>
                </div>
            </div>
            {/* Filter Popup - Moved outside header but inside relative container if needed, logic remains same */}
            {showFilters && (
                <div className="filter-popup">
                    <div className="filter-header">
                        <h4>Filter Data</h4>
                        <button onClick={() => setShowFilters(false)} className="filter-close">&times;</button>
                    </div>

                    <div className="filter-body">
                        <div className="form-group">
                            <label>Joined Date Range</label>
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
                        <p style={{ fontSize: '0.65rem', color: '#9CA3AF', fontStyle: 'italic', marginTop: '0.5rem' }}>
                            Filters based on employee joining date.
                        </p>
                    </div>
                    <div className="filter-actions">
                        <button
                            className="btn-sm btn-outline"
                            onClick={() => {
                                setFilters({ startDate: '', endDate: '' });
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

            <div className="chart-container">
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                    </div>
                )}

                {!loading && !hasData && (
                    <div className="loading-overlay" style={{ background: 'transparent' }}>
                        <p className="widget-subtitle">No data available</p>
                    </div>
                )}

                {chartType === 'grid' ? (
                    <div className="dashboard-table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                    <th style={{ textAlign: 'right' }}>Distribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((entry, index) => {
                                    const percent = ((entry.count / totalEmployees) * 100).toFixed(1);
                                    return (
                                        <tr key={index}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div
                                                        style={{ width: '4px', height: '20px', borderRadius: '4px', backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <span style={{ fontWeight: 600 }}>{entry.department_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 700, background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{entry.count}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', width: '33%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', width: '3rem', textAlign: 'right' }}>{percent}%</span>
                                                    <div style={{ width: '6rem', height: '0.5rem', background: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                height: '100%',
                                                                width: `${percent}%`,
                                                                backgroundColor: COLORS[index % COLORS.length],
                                                                transition: 'width 0.5s'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="department_name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={chartType === 'donut' ? 100 : 0}
                                    outerRadius={160}
                                    paddingAngle={4}
                                    dataKey="count"
                                    nameKey="department_name"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value} Employees`, 'Count']}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ paddingLeft: '40px' }}
                                />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
});

export default DepartmentWidget;
