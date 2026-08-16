import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const SuperAdminPlatformAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadAuditLogs(1);
  }, [category]);

  const loadAuditLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await tenantService.getPlatformAuditLogs({
        category,
        search,
        page,
        limit: 25
      });
      if (res.success) {
        setLogs(res.logs || []);
        setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load platform audit logs:', err);
      setError(err.response?.data?.message || 'Failed to load platform audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAuditLogs(1);
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'impersonation':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Impersonation</span>;
      case 'backup_restore':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Backup & Restore</span>;
      case 'plan_change':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Plan & Pricing</span>;
      case 'broadcast':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Broadcast</span>;
      case 'security':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Security</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">Tenant Mgmt</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-black tracking-wide">
              SECURITY & COMPLIANCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-red-600" /> Platform Cross-Tenant Audit Log
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Immutable SOC2-grade activity log tracking administrative impersonations, backups, security events, and configuration modifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button onClick={() => loadAuditLogs(pagination.page)} className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5">
            <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FunnelIcon className="w-4 h-4 text-neutral-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input text-xs py-1.5"
          >
            <option value="all">All Action Categories</option>
            <option value="impersonation">Tenant Impersonation</option>
            <option value="tenant_mgmt">Tenant Management</option>
            <option value="backup_restore">Backup & Restore</option>
            <option value="plan_change">Plan & Entitlements</option>
            <option value="broadcast">Broadcasts</option>
            <option value="security">Security Events</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, or tenant ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs py-1.5 w-full"
          />
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="card p-0 overflow-hidden border border-neutral-200 rounded-2xl shadow-xs bg-white">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Activity Trail</h2>
            <p className="text-[11px] text-neutral-500">Real-time record of all administrative transactions</p>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            {pagination.total} {pagination.total === 1 ? 'record' : 'records'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheckIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-700">No audit records found</p>
            <p className="text-xs text-neutral-400 mt-0.5">Adjust filter criteria to view past events</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="p-3 font-bold text-neutral-600">Timestamp</th>
                  <th className="p-3 font-bold text-neutral-600">Action / Event</th>
                  <th className="p-3 font-bold text-neutral-600">Category</th>
                  <th className="p-3 font-bold text-neutral-600">Super Admin Actor</th>
                  <th className="p-3 font-bold text-neutral-600">Target Workspace</th>
                  <th className="p-3 font-bold text-neutral-600">IP & Origin</th>
                  <th className="p-3 font-bold text-neutral-600 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="p-3 text-[11px] text-neutral-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-neutral-900 text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3">{getCategoryBadge(log.category)}</td>
                    <td className="p-3">
                      <div className="font-bold text-neutral-800">{log.actor_email}</div>
                      <div className="text-[10px] text-neutral-400">{log.actor_role}</div>
                    </td>
                    <td className="p-3">
                      {log.target_tenant_id ? (
                        <span className="font-mono px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px]">
                          {log.target_tenant_id}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="p-3 text-[10px] text-neutral-500 font-mono">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 hover:border-primary-400 text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-neutral-100 flex items-center justify-between text-xs bg-neutral-50/60">
            <span className="text-neutral-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadAuditLogs(pagination.page - 1)}
                className="btn btn-secondary btn-xs text-xs"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadAuditLogs(pagination.page + 1)}
                className="btn btn-secondary btn-xs text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-neutral-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-red-600" />
                Audit Record Details (ID #{selectedLog.id})
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-neutral-700 text-lg leading-none">&times;</button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Action</span>
                  <p className="font-mono font-bold text-neutral-900">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Category</span>
                  <p className="font-bold text-neutral-900 capitalize">{selectedLog.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Actor</span>
                  <p className="font-bold text-neutral-900">{selectedLog.actor_email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Target Workspace</span>
                  <p className="font-mono text-neutral-900">{selectedLog.target_tenant_id || 'Platform Wide'}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Payload Details (JSONB)</span>
                <pre className="p-3 bg-primary-950/90 dark:bg-gray-950 border border-primary-900/40 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div className="text-[11px] text-neutral-500">
                <span className="font-bold">User Agent:</span> {selectedLog.user_agent || 'Standard HTTP Client'}
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-100">
                <button onClick={() => setSelectedLog(null)} className="btn btn-secondary btn-xs text-xs">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPlatformAudit;
