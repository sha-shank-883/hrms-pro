import React, { useEffect, useState } from 'react';
import { payrollService } from '../services';
import {
  FaLayerGroup,
  FaPlus,
  FaCheckCircle,
  FaPlay,
  FaArchive,
  FaTrash,
  FaFilter,
  FaTimes,
  FaFileExport,
  FaSpinner,
  FaChevronDown,
  FaChevronRight,
  FaMoneyBillWave,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  finalized: { label: 'Finalized', bg: 'bg-primary-100 text-blue-700', dot: 'bg-primary-500' },
  paid: { label: 'Paid', bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  archived: { label: 'Archived', bg: 'bg-secondary-100 text-secondary-700', dot: 'bg-secondary-500' }
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PayrollRuns = () => {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [runDetail, setRunDetail] = useState(null);
  const [showRunDetail, setShowRunDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedRun, setExpandedRun] = useState(null);
  const [expandedPayslips, setExpandedPayslips] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    year: new Date().getFullYear()
  });
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filters.status) params.status = filters.status;
      if (filters.year) params.year = filters.year;
      const response = await payrollService.getRuns(params);
      setRuns(response.data);
      setPagination(response.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load payroll runs: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => loadRuns(1);

  const clearFilters = () => {
    setFilters({ status: '', year: new Date().getFullYear() });
    loadRuns(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) loadRuns(newPage);
  };

  const handleCreate = async () => {
    if (!formData.month || !formData.year) {
      setError('Month and year are required');
      return;
    }
    try {
      setCreating(true);
      setError('');
      await payrollService.createRun({
        period_month: formData.month,
        period_year: formData.year,
        notes: formData.notes
      });
      setSuccess('Payroll run created successfully');
      setShowCreateModal(false);
      setFormData({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: '' });
      loadRuns(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create run');
    } finally {
      setCreating(false);
    }
  };

  const performAction = async (id, action, label) => {
    try {
      setActionLoading(`${action}-${id}`);
      setError('');
      await payrollService[`${action}Run`](id);
      setSuccess(`Run ${label} successfully`);
      loadRuns(pagination.currentPage);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} run`);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = async (runId) => {
    if (expandedRun === runId) {
      setExpandedRun(null);
      setExpandedPayslips({});
      return;
    }
    try {
      const response = await payrollService.getRun(runId);
      setRunDetail(response.data);
      setExpandedRun(runId);
      if (response.data.payslips) {
        const map = {};
        response.data.payslips.forEach(ps => { map[ps.id] = true; });
        setExpandedPayslips(map);
      }
    } catch (err) {
      setError('Failed to load run details');
    }
  };

  const downloadPayslipPdf = async (payslipId) => {
    try {
      const blob = await payrollService.downloadPayslipPdf(payslipId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  const exportRuns = async () => {
    try {
      const blob = await payrollService.exportRuns(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_runs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export');
    }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const pages = [];
    const start = Math.max(1, pagination.currentPage - 2);
    const end = Math.min(pagination.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-all">
          Previous
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => handlePageChange(p)}
            className={`w-10 h-10 text-sm font-semibold rounded-xl transition-all ${p === pagination.currentPage
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-all">
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="w-full pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage payroll run lifecycle</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportRuns} className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <FaFileExport /> Export
          </button>
          <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2">
            <FaPlus /> New Run
          </button>
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

      <div className="card mb-6">
        <div className="card-body">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="form-label">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="form-select">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="finalized">Finalized</option>
                <option value="paid">Paid</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="form-label">Year</label>
              <input type="number" name="year" value={filters.year} onChange={handleFilterChange} className="form-input" placeholder="Year" />
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-2">
                <FaFilter /> Apply
              </button>
              <button onClick={clearFilters} className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                <FaTimes /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <FaSpinner className="animate-spin text-3xl text-primary-600" />
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FaLayerGroup className="text-5xl mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-500">No payroll runs found</p>
            <p className="text-sm mt-1">Create a new payroll run to get started</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Period</th>
                <th>Status</th>
                <th>Total Gross</th>
                <th>Total Deductions</th>
                <th>Total Net</th>
                <th>Employees</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <React.Fragment key={run.run_id}>
                  <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleExpand(run.run_id)}>
                    <td className="px-4">
                      {expandedRun === run.run_id ? <FaChevronDown className="text-gray-400" /> : <FaChevronRight className="text-gray-400" />}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{run.period_month}/{run.period_year}</span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={run.status} /></td>
                    <td className="px-6 py-4 font-medium text-gray-900">{parseFloat(run.total_gross || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{parseFloat(run.total_deductions || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-primary-600">{parseFloat(run.total_net || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg">{run.total_employees || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(run.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {run.status === 'draft' && (
                          <>
                            <button onClick={() => performAction(run.run_id, 'finalize', 'finalized')}
                              disabled={actionLoading === `finalize-${run.run_id}`}
                              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                              {actionLoading === `finalize-${run.run_id}` ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Finalize
                            </button>
                            <button onClick={() => performAction(run.run_id, 'delete', 'deleted')}
                              disabled={actionLoading === `delete-${run.run_id}`}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                              {actionLoading === `delete-${run.run_id}` ? <FaSpinner className="animate-spin" /> : <FaTrash />} Delete
                            </button>
                          </>
                        )}
                        {run.status === 'finalized' && (
                          <button onClick={() => performAction(run.run_id, 'pay', 'paid')}
                            disabled={actionLoading === `pay-${run.run_id}`}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {actionLoading === `pay-${run.run_id}` ? <FaSpinner className="animate-spin" /> : <FaMoneyBillWave />} Pay
                          </button>
                        )}
                        {(run.status === 'finalized' || run.status === 'paid') && (
                          <button onClick={() => performAction(run.run_id, 'archive', 'archived')}
                            disabled={actionLoading === `archive-${run.run_id}`}
                            className="px-3 py-1.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {actionLoading === `archive-${run.run_id}` ? <FaSpinner className="animate-spin" /> : <FaArchive />} Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRun === run.run_id && runDetail && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-700">Payslips in this run</h4>
                            <span className="text-sm text-gray-500">{runDetail.payslips?.length || 0} payslips</span>
                          </div>
                          {(!runDetail.payslips || runDetail.payslips.length === 0) ? (
                            <p className="text-sm text-gray-400 text-center py-4">No payslips generated yet</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="data-table text-sm">
                                <thead>
                                  <tr>
                                    <th>Employee</th>
                                    <th>Basic</th>
                                    <th>Gross</th>
                                    <th>Net</th>
                                    <th>Status</th>
                                    <th>PDF</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {runDetail.payslips.map(ps => (
                                    <tr key={ps.payslip_id}>
                                      <td className="px-4 py-2 font-medium">{ps.employee_name || ps.employee_id}</td>
                                      <td className="px-4 py-2">{parseFloat(ps.basic_salary || 0).toLocaleString()}</td>
                                      <td className="px-4 py-2">{parseFloat(ps.gross_pay || 0).toLocaleString()}</td>
                                      <td className="px-4 py-2 font-semibold">{parseFloat(ps.net_pay || 0).toLocaleString()}</td>
                                      <td className="px-4 py-2">
                                        <StatusBadge status={ps.payment_status || 'pending'} />
                                      </td>
                                      <td className="px-4 py-2">
                                        <button onClick={() => downloadPayslipPdf(ps.payslip_id)}
                                          className="text-primary-600 hover:text-primary-700 text-xs font-semibold">
                                          Download PDF
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {renderPagination()}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create Payroll Run</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><FaTimes /></button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Month</label>
                  <select value={formData.month} onChange={e => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))} className="form-select">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <input type="number" value={formData.year} onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="form-input" min={2020} max={2035} />
                </div>
              </div>
              <div>
                <label className="form-label">Notes (optional)</label>
                <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="form-input" rows={3} placeholder="Any notes about this run" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2">
                {creating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                Create Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollRuns;
