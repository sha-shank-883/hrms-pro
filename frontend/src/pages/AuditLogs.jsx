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
        return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FaHistory className="text-gray-400" /> Audit Logs
                    </h1>
                    <p className="text-gray-500 mt-1">Track system activities, security events, and user actions.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="p-4 grid grid-cols-4 gap-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaSearch /></span>
                        <input
                            type="text"
                            className="form-input pl-10"
                            name="action"
                            placeholder="Filter by Action..."
                            value={filters.action}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaUser /></span>
                        <input
                            type="text"
                            className="form-input pl-10"
                            name="user"
                            placeholder="Search User..."
                            value={filters.user}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaCalendarAlt /></span>
                        <input
                            type="date"
                            className="form-input pl-10"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaCalendarAlt /></span>
                        <input
                            type="date"
                            className="form-input pl-10"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">System Activity</h3>
                </div>
                <div className="p-0 table-responsive">
                    <table className="data-table w-full">
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
                                    <td colSpan="6" className="text-center py-8">
                                        <div className="flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <React.Fragment key={log.log_id}>
                                        <tr className={expandedLog === log.log_id ? 'bg-indigo-50/50' : ''}>
                                            <td className="whitespace-nowrap text-gray-600 font-mono text-xs">{formatDate(log.created_at)}</td>
                                            <td>
                                                {log.first_name ? (
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{log.first_name} {log.last_name}</div>
                                                        <div className="text-xs text-gray-500">{log.email}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">System / Unknown</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`font-mono text-xs font-bold ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>
                                                {log.entity_type && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                        {log.entity_type} <span className="text-gray-400 ml-1">#{log.entity_id}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-sm text-gray-500 font-mono">{log.ip_address}</td>
                                            <td>
                                                <button
                                                    className={`btn btn-xs ${expandedLog === log.log_id ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => toggleExpand(log.log_id)}
                                                >
                                                    {expandedLog === log.log_id ? 'Hide' : 'View'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedLog === log.log_id && (
                                            <tr>
                                                <td colSpan="6" className="p-0 border-b border-indigo-100 bg-gray-50">
                                                    <div className="p-4 flex gap-6">
                                                        <div className="flex-1">
                                                            <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                                                                <FaCode /> Request Payload & Details
                                                            </h4>
                                                            <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto border border-gray-800 shadow-inner">
                                                                <pre className="text-xs font-mono text-green-400">
                                                                    {JSON.stringify(log.details, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                        <div className="w-64 border-l border-gray-200 pl-6">
                                                            <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Metadata</h4>
                                                            <div className="text-sm text-gray-600 space-y-3">
                                                                <div>
                                                                    <div className="text-xs text-gray-400">User Agent</div>
                                                                    <div className="break-words text-xs">{log.user_agent}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-gray-400">Log ID</div>
                                                                    <div className="font-mono text-xs font-bold">#{log.log_id}</div>
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
                                    <td colSpan="6" className="text-center py-12 text-gray-400">
                                        <FaHistory className="mx-auto mb-2 text-3xl opacity-20" />
                                        <p>No audit logs found matching your filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="text-sm text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-bold text-gray-900">{pagination.total}</span> entries
                    </div>
                    <div className="flex gap-2">
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
