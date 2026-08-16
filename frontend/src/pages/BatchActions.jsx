import React, { useEffect, useState } from 'react';
import { payrollService, employeeService } from '../services';
import {
  FaRocket,
  FaEnvelope,
  FaRedo,
  FaBan,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaDownload,
  FaUsers,
  FaLayerGroup,
  FaSearch,
  FaPlay,
  FaFilter
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const QUEUE_STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  sent: { label: 'Sent', bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  failed: { label: 'Failed', bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
};

const QueueBadge = ({ status }) => {
  const cfg = QUEUE_STATUS_CONFIG[status] || QUEUE_STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
    </span>
  );
};

const BatchActions = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employees, setEmployees] = useState([]);

  const [bulkForm, setBulkForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department_id: '',
    run_id: ''
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const [queueItems, setQueueItems] = useState([]);
  const [queueStats, setQueueStats] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueFilter, setQueueFilter] = useState('pending');
  const [queuePagination, setQueuePagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    employeeService.getAll().then(r => setEmployees(r.data || [])).catch(() => { });
    if (activeTab === 'email-queue') loadQueue();
  }, [activeTab]);

  const loadQueue = async (page = 1) => {
    try {
      setQueueLoading(true);
      const params = { page, limit: 15 };
      if (queueFilter) params.status = queueFilter;
      const response = await payrollService.getEmailQueue(params);
      setQueueItems(response.data || []);
      setQueuePagination(response.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
      const stats = await payrollService.getEmailQueueStats();
      setQueueStats(stats.data);
    } catch (err) {
      setError('Failed to load email queue');
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'email-queue') loadQueue();
  }, [queueFilter]);

  const handleBulkGenerate = async () => {
    if (!bulkForm.month || !bulkForm.year) {
      setError('Month and year are required');
      return;
    }
    try {
      setBulkLoading(true);
      setError('');
      setBulkResult(null);
      const response = await payrollService.generateBulkPayslips(bulkForm);
      setBulkResult(response.data);
      setSuccess(response.message || 'Bulk generation completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk generation failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleQueueAction = async (id, action, label) => {
    try {
      setActionLoading(`${action}-${id}`);
      setError('');
      await payrollService[action === 'retry' ? 'retryEmail' : 'cancelEmail'](id);
      setSuccess(`Email ${label} successfully`);
      loadQueue(queuePagination.currentPage);
      const stats = await payrollService.getEmailQueueStats();
      setQueueStats(stats.data);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} email`);
    } finally {
      setActionLoading(null);
    }
  };

  const exportPayslips = async () => {
    try {
      const blob = await payrollService.exportPayslips({});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslips_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed');
    }
  };

  const renderQueuePagination = () => {
    if (queuePagination.totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= queuePagination.totalPages; i++) pages.push(i);
    return (
      <div className="flex justify-center items-center gap-2 mt-4">
        <button onClick={() => loadQueue(queuePagination.currentPage - 1)} disabled={queuePagination.currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">Previous</button>
        {pages.map(p => (
          <button key={p} onClick={() => loadQueue(p)}
            className={`w-9 h-9 text-sm font-semibold rounded-xl ${p === queuePagination.currentPage ? 'bg-primary-600 text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => loadQueue(queuePagination.currentPage + 1)} disabled={queuePagination.currentPage === queuePagination.totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next</button>
      </div>
    );
  };

  return (
    <div className="w-full pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Actions</h1>
          <p className="text-sm text-gray-500 mt-1">Bulk payslip generation and email queue management</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-3">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700"><FaTimes /></button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-3">
          <FaCheckCircle /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700"><FaTimes /></button>
        </div>
      )}

      <div className="border-b border-gray-100 mb-6">
        <div className="flex space-x-6">
          {[
            { key: 'generate', label: 'Bulk Generate', icon: FaRocket },
            { key: 'email-queue', label: 'Email Queue', icon: FaEnvelope },
            { key: 'export', label: 'Export', icon: FaDownload }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'generate' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaRocket className="text-primary-600" /> Bulk Generate Payslips
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Month</label>
                  <select value={bulkForm.month} onChange={e => setBulkForm(prev => ({ ...prev, month: parseInt(e.target.value) }))} className="form-select">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <input type="number" value={bulkForm.year} onChange={e => setBulkForm(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Department (optional)</label>
                  <select value={bulkForm.department_id} onChange={e => setBulkForm(prev => ({ ...prev, department_id: e.target.value }))} className="form-select">
                    <option value="">All Departments</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={handleBulkGenerate} disabled={bulkLoading}
                    className="w-full px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {bulkLoading ? <FaSpinner className="animate-spin" /> : <FaPlay />}
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {bulkResult && (
            <div className="card bg-green-50 border-green-200">
              <div className="card-body">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <FaCheckCircle /> Generation Complete
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center border border-green-100">
                    <div className="text-2xl font-bold text-primary-600">{bulkResult.total || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Payslips</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-green-100">
                    <div className="text-2xl font-bold text-green-600">{bulkResult.generated || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Generated</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-amber-100">
                    <div className="text-2xl font-bold text-amber-600">{bulkResult.skipped || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Skipped (duplicates)</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-red-100">
                    <div className="text-2xl font-bold text-red-600">{bulkResult.errors || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Errors</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'email-queue' && (
        <div className="space-y-6">
          {queueStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total', value: queueStats.total, color: 'text-gray-900', bg: 'bg-white' },
                { label: 'Pending', value: queueStats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Sent', value: queueStats.sent, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Failed', value: queueStats.failed, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Cancelled', value: queueStats.cancelled, color: 'text-gray-500', bg: 'bg-gray-50' }
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} rounded-2xl border border-gray-100 shadow-sm p-4 text-center`}>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            {['', 'pending', 'sent', 'failed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setQueueFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${queueFilter === s
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s || 'All'}
              </button>
            ))}
            <button onClick={() => loadQueue(1)} className="ml-auto px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
              <FaRedo /> Refresh
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            {queueLoading ? (
              <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-2xl text-primary-600" /></div>
            ) : queueItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaEnvelope className="text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm text-gray-500">No email queue items</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Payslip</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Last Error</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queueItems.map(item => (
                    <tr key={item.queue_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.employee_name || `Emp #${item.employee_id}`}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">#{item.payslip_id}</td>
                      <td className="px-6 py-4"><QueueBadge status={item.status} /></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.attempts || 0}/3</td>
                      <td className="px-6 py-4 text-sm text-red-500 max-w-[200px] truncate">{item.last_error || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.status === 'failed' && (
                            <button onClick={() => handleQueueAction(item.queue_id, 'retry', 'retried')}
                              disabled={actionLoading === `retry-${item.queue_id}`}
                              className="px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-blue-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                              {actionLoading === `retry-${item.queue_id}` ? <FaSpinner className="animate-spin" /> : <FaRedo />} Retry
                            </button>
                          )}
                          {(item.status === 'pending' || item.status === 'failed') && (
                            <button onClick={() => handleQueueAction(item.queue_id, 'cancel', 'cancelled')}
                              disabled={actionLoading === `cancel-${item.queue_id}`}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                              {actionLoading === `cancel-${item.queue_id}` ? <FaSpinner className="animate-spin" /> : <FaBan />} Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {renderQueuePagination()}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaDownload className="text-primary-600" /> Export Payroll Data
              </h3>
              <p className="text-sm text-gray-500 mb-6">Download CSV exports of payslips, payroll runs, and earnings breakdowns.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                  <FaFileInvoiceDollar className="text-2xl text-primary-600 mb-3" />
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">Payslips</h4>
                  <p className="text-xs text-gray-500 mb-4">Export all payslips with employee and payment details</p>
                  <button onClick={exportPayslips} className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <FaDownload /> Export CSV
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                  <FaLayerGroup className="text-2xl text-primary-600 mb-3" />
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">Payroll Runs</h4>
                  <p className="text-xs text-gray-500 mb-4">Export payroll run summaries with totals</p>
                  <button onClick={async () => {
                    try {
                      const blob = await payrollService.exportRuns({});
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `payroll_runs_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (err) { setError('Export failed'); }
                  }} className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <FaDownload /> Export CSV
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                  <FaUsers className="text-2xl text-primary-600 mb-3" />
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">Earnings Breakdown</h4>
                  <p className="text-xs text-gray-500 mb-4">Export detailed earnings components per payslip</p>
                  <select id="export-run-select" className="form-select text-sm mb-2" defaultValue="">
                    <option value="" disabled>Select a run (TODO)</option>
                  </select>
                  <button disabled className="w-full px-4 py-2 bg-gray-300 text-gray-500 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <FaDownload /> Select Run First
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchActions;
