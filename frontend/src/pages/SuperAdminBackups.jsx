import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import {
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CircleStackIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const SuperAdminBackups = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await tenantService.getBackupArchives();
      if (res.success && res.archives) {
        setArchives(res.archives);
      }
    } catch (err) {
      console.error('Failed to load backup archives:', err);
      setError(err.response?.data?.message || 'Failed to load backup archives');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBulkBackup = async () => {
    if (!window.confirm('Trigger a full database snapshot across all active tenant workspaces?')) return;
    try {
      setTriggering(true);
      setError('');
      setSuccess('');
      const res = await tenantService.triggerAllTenantBackups();
      if (res.success) {
        setSuccess(res.message || 'All tenant database snapshots captured successfully');
        loadArchives();
      }
    } catch (err) {
      console.error('Bulk backup error:', err);
      setError(err.response?.data?.message || 'Failed to generate bulk snapshots');
    } finally {
      setTriggering(false);
    }
  };

  const handleDownload = (id) => {
    const token = localStorage.getItem('token');
    window.open(`/api/tenants/backups/archives/${id}/download?token=${token}`, '_blank');
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-black tracking-wide">
              DATA RECOVERY & DISASTER PREPAREDNESS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 flex items-center gap-2">
            <CloudArrowUpIcon className="w-6 h-6 text-purple-600" /> Automated Tenant Backups & Cloud Snapshots
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Full platform tenant database snapshots, point-in-time disaster recovery archives, and JSON data exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button onClick={loadArchives} className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5">
            <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            disabled={triggering}
            onClick={handleTriggerBulkBackup}
            className="btn btn-primary btn-xs text-xs flex items-center gap-1.5 shadow-xs"
          >
            <SparklesIcon className={triggering ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
            {triggering ? 'Capturing Snapshots...' : 'Snapshot All Active Tenants'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs">
          {success}
        </div>
      )}

      {/* 3 Summary Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Snapshots</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <CircleStackIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900">{archives.length}</p>
          <p className="text-[10px] text-neutral-400 mt-1">Available restore points</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Automated Daily Sync</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">Active</p>
          <p className="text-[10px] text-neutral-400 mt-1">Nightly snapshot daemon</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Isolation Architecture</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <DocumentDuplicateIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900">Per-Schema</p>
          <p className="text-[10px] text-neutral-400 mt-1">Zero cross-tenant leakage</p>
        </div>
      </div>

      {/* Archives Table */}
      <div className="card p-0 overflow-hidden border border-neutral-200 rounded-2xl shadow-xs bg-white">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Tenant Snapshot Archives</h2>
            <p className="text-[11px] text-neutral-500">Downloadable point-in-time tenant data exports</p>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            {archives.length} Archives
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading backup archives...</div>
        ) : archives.length === 0 ? (
          <div className="p-12 text-center">
            <CloudArrowUpIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-700">No snapshot archives yet</p>
            <p className="text-xs text-neutral-400 mt-0.5">Click "Snapshot All Active Tenants" to create your first archive</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="p-3 font-bold text-neutral-600">Tenant / Company</th>
                  <th className="p-3 font-bold text-neutral-600">Archive Filename</th>
                  <th className="p-3 font-bold text-neutral-600">Size</th>
                  <th className="p-3 font-bold text-neutral-600">Tables / Records</th>
                  <th className="p-3 font-bold text-neutral-600">Captured At</th>
                  <th className="p-3 font-bold text-neutral-600 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {archives.map((a) => (
                  <tr key={a.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-neutral-900">{a.tenant_name || a.tenant_id}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{a.tenant_id}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-neutral-700">
                      {a.filename}
                    </td>
                    <td className="p-3 font-bold text-neutral-900">
                      {formatBytes(a.file_size_bytes)}
                    </td>
                    <td className="p-3 text-neutral-600">
                      <div>{a.table_count} tables</div>
                      <div className="text-[10px] text-neutral-400">{a.record_count} total records</div>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-500">
                      {new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownload(a.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        JSON Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminBackups;
