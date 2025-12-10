import React, { useState, useEffect } from 'react';
import { auditService } from '../services';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaFilter, FaHistory, FaUser, FaCalendarAlt, FaCode } from 'react-icons/fa';

const AuditLogs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });
    const [filters, setFilters] = useState({
        action: '',
        user: '',
        startDate: '',
        endDate: ''
    });
    const [expandedLog, setExpandedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await auditService.getLogs({
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            });
            setLogs(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
    };

    const toggleExpand = (logId) => {
        setExpandedLog(expandedLog === logId ? null : logId);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getActionColor = (action) => {
        if (action.includes('DELETE')) return 'text-red-600';
        if (action.includes('CREATE')) return 'text-green-600';
        if (action.includes('UPDATE')) return 'text-blue-600';
        if (action.includes('LOGIN')) return 'text-purple-600';
        return 'text-gray-600';
    };

    if (user.role !== 'admin') {
        return <div className="container">Access Denied</div>;
    }

    return (
        <div className="container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Audit Logs</h1>
                    <p className="page-description">Track system activities and user actions.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <div className="input-group">
                            <span className="input-group-text"><FaSearch /></span>
                            <input
                                type="text"
                                className="form-input"
                                name="action"
                                placeholder="Filter by Action..."
                                value={filters.action}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <div className="input-group">
                            <span className="input-group-text"><FaUser /></span>
                            <input
                                type="text"
                                className="form-input"
                                name="user"
                                placeholder="Search User..."
                                value={filters.user}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <div className="input-group">
                            <span className="input-group-text"><FaCalendarAlt /></span>
                            <input
                                type="date"
                                className="form-input"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <div className="input-group">
                            <span className="input-group-text"><FaCalendarAlt /></span>
                            <input
                                type="date"
                                className="form-input"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>IP Address</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">Loading...</td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <React.Fragment key={log.log_id}>
                                        <tr className={expandedLog === log.log_id ? 'bg-gray-50' : ''}>
                                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                                            <td>
                                                {log.first_name ? (
                                                    <div>
                                                        <div className="font-medium">{log.first_name} {log.last_name}</div>
                                                        <div className="text-xs text-gray-500">{log.email}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">System / Unknown</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`font-medium ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>
                                                {log.entity_type && (
                                                    <span className="badge badge-ghost">
                                                        {log.entity_type} #{log.entity_id}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-sm text-gray-500">{log.ip_address}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => toggleExpand(log.log_id)}
                                                >
                                                    {expandedLog === log.log_id ? 'Hide' : 'View'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedLog === log.log_id && (
                                            <tr>
                                                <td colSpan="6" style={{ padding: 0 }}>
                                                    <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                        <div style={{ display: 'flex', gap: '2rem' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <FaCode /> Request Details
                                                                </h4>
                                                                <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', overflowX: 'auto' }}>
                                                                    {JSON.stringify(log.details, null, 2)}
                                                                </pre>
                                                            </div>
                                                            <div style={{ width: '250px' }}>
                                                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Metadata</h4>
                                                                <div className="text-sm text-gray-600">
                                                                    <div className="mb-2">
                                                                        <strong>User Agent:</strong><br />
                                                                        {log.user_agent}
                                                                    </div>
                                                                    <div>
                                                                        <strong>Log ID:</strong> {log.log_id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        <FaHistory className="mx-auto mb-2 text-3xl opacity-20" />
                                        No audit logs found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <div className="text-sm text-gray-500">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-sm btn-secondary"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-sm btn-secondary"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
