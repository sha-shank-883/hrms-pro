import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import {
  CpuChipIcon,
  ServerStackIcon,
  CircleStackIcon,
  BoltIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckBadgeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const SuperAdminHealth = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadHealth, 10000); // 10s live pulse
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadHealth = async () => {
    try {
      setError('');
      const res = await tenantService.getSystemHealthDiagnostics();
      if (res.success && res.data) {
        setDiagnostics(res.data);
      }
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
      setError(err.response?.data?.message || 'Failed to fetch server telemetry');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  if (loading && !diagnostics) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-neutral-600">Gathering system diagnostics and connection pool metrics...</p>
      </div>
    );
  }

  const pool = diagnostics?.pool || {};
  const memory = diagnostics?.memory || {};
  const schemas = diagnostics?.schemas || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-black tracking-wide">
              INFRASTRUCTURE TELEMETRY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 flex items-center gap-2">
            <CpuChipIcon className="w-6 h-6 text-emerald-600" /> Live System Health & Diagnostics
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time PostgreSQL connection pool metrics, schema disk storage allocations, process memory, and server latency.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-600 cursor-pointer bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-primary-600"
            />
            Live 10s Pulse
          </label>
          <button onClick={loadHealth} className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5">
            <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* 4 Core Health Metric Cards */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
        {/* Query Latency */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Database Latency</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <BoltIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{pool.queryLatencyMs || 0} ms</p>
          <p className="text-[10px] text-neutral-400 mt-1">Direct query round-trip</p>
        </div>

        {/* Connection Pool */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">DB Connection Pool</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <CircleStackIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900">
            {pool.idleConnections || 0} <span className="text-xs font-normal text-neutral-500">idle / {pool.totalConnections || 0} total</span>
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">{pool.waitingClients || 0} waiting client queries</p>
        </div>

        {/* Process Memory (Heap Used) */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Node.js Heap Memory</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <ServerStackIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700">{memory.heapUsed || '0 MB'}</p>
          <p className="text-[10px] text-neutral-400 mt-1">RSS: {memory.rss || '0 MB'}</p>
        </div>

        {/* Server Uptime */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">System Uptime</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ClockIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900">{formatUptime(diagnostics?.uptimeSeconds)}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{diagnostics?.nodeVersion} ({diagnostics?.platform})</p>
        </div>
      </div>

      {/* Tenant Schema Storage Allocations */}
      <div className="card p-0 overflow-hidden border border-neutral-200 rounded-2xl shadow-xs bg-white">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <CircleStackIcon className="w-4 h-4 text-primary-600" /> Tenant Schema Database Storage Breakdown
            </h2>
            <p className="text-[11px] text-neutral-500">Live PostgreSQL storage consumption across all company workspaces</p>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            {schemas.length} Schemas Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="p-3 font-bold text-neutral-600">Schema Identifier</th>
                <th className="p-3 font-bold text-neutral-600">Type</th>
                <th className="p-3 font-bold text-neutral-600">Table Count</th>
                <th className="p-3 font-bold text-neutral-600 text-right">Disk Space Allocated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {schemas.map((s, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-neutral-900">
                    {s.schema_name}
                  </td>
                  <td className="p-3">
                    {s.schema_name === 'shared' || s.schema_name === 'public' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Platform Shared
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Tenant Isolated
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-neutral-600">
                    {s.table_count} tables
                  </td>
                  <td className="p-3 text-right font-black text-neutral-900">
                    {s.total_size}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminHealth;
