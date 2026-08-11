import React, { useEffect, useState } from 'react';
import { payrollService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import PayslipDetailModal from '../components/payroll/PayslipDetailModal';
import {
  FaReceipt,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaPrint,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDownload,
  FaBuilding,
  FaUser,
  FaBriefcase,
  FaTimes,
  FaArchive,
  FaRedo,
  FaDownload as FaDownloadAll,
  FaSearch,
  FaSpinner,
  FaFilter,
  FaMoneyBillWave
} from 'react-icons/fa';

const MyPayslips = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [payslips, setPayslips] = useState([]);
  const [archivedPayslips, setArchivedPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, archived: 0, total_net: 0 });

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getMyPayslips();
      const all = response.data || [];
      const current = all.filter(p => !p.is_archived);
      const archived = all.filter(p => p.is_archived);
      setPayslips(current);
      setArchivedPayslips(archived);
      setStats({
        total: all.length,
        paid: all.filter(p => p.payment_status === 'paid').length,
        pending: all.filter(p => p.payment_status !== 'paid').length,
        archived: archived.length,
        total_net: all.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0)
      });
      setError('');
    } catch (error) {
      setError('Failed to load payslips: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const viewPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setShowModal(true);
  };

  const toggleArchive = async (payslip) => {
    try {
      setError('');
      const id = payslip.id || payslip.payroll_id;
      const action = payslip.is_archived ? 'unarchived' : 'archived';
      await payrollService.update(id, { is_archived: !payslip.is_archived });
      setSuccess(`Payslip ${action} successfully`);
      loadPayslips();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to ' + (payslip.is_archived ? 'unarchive' : 'archive') + ' payslip');
    }
  };

  const requestReissue = async (payslip) => {
    try {
      setError('');
      const id = payslip.id || payslip.payroll_id;
      await payrollService.queuePayslipEmail(id);
      setSuccess('Reissue requested — payslip will be emailed shortly');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to request reissue');
    }
  };

  const downloadAll = async () => {
    try {
      setDownloadingAll(true);
      setError('');
      const items = activeTab === 'current' ? payslips : archivedPayslips;
      for (const p of items) {
        try {
          const id = p.id || p.payroll_id;
          const blob = await payrollService.downloadPayslipPdf(id);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payslip_${p.employee_name || 'employee'}_${p.month || p.period_month}_${p.year || p.period_year}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
        }
      }
      setSuccess(`Downloaded ${items.length} payslips`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download all payslips');
    } finally {
      setDownloadingAll(false);
    }
  };

  const getFilteredList = () => {
    const list = activeTab === 'current' ? payslips : archivedPayslips;
    if (!filterMonth && !filterYear) return list;
    return list.filter(p => {
      const m = p.month || p.period_month;
      const y = p.year || p.period_year;
      return (!filterMonth || String(m) === String(filterMonth)) &&
             (!filterYear || String(y) === String(filterYear));
    });
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[(month - 1)] || month;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  const filteredPayslips = getFilteredList();
  const currency = getSetting('currency_symbol', '$');

  return (
    <div className="w-full pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-sm text-gray-500 mt-1">View, download, and manage your salary slips.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={downloadAll} disabled={downloadingAll || filteredPayslips.length === 0}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all disabled:opacity-40 flex items-center gap-2">
            {downloadingAll ? <FaSpinner className="animate-spin" /> : <FaDownloadAll />}
            Download All
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-3">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError('')} className="ml-auto"><FaTimes /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-3">
          <FaCheckCircle /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><FaTimes /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Paid', value: stats.paid, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Archived', value: stats.archived, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Net', value: currency + stats.total_net.toLocaleString(), color: 'text-primary-600', bg: 'bg-primary-50' }
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl border border-gray-100 shadow-sm p-4 text-center`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-100 mb-6">
        <div className="flex space-x-6">
          <button onClick={() => setActiveTab('current')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'current' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Current ({payslips.length})
          </button>
          <button onClick={() => setActiveTab('archived')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'archived' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FaArchive /> Archived ({archivedPayslips.length})
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="form-label">Month</label>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="form-select">
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Year</label>
              <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)} className="form-input" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFilterMonth(''); setFilterYear(new Date().getFullYear()); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                <FaFilter /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        {filteredPayslips.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="flex flex-col items-center justify-center">
              <div className="p-4 bg-gray-50 rounded-full mb-4 text-gray-400">
                <FaFileInvoiceDollar size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No Payslips Available</h3>
              <p className="text-sm">You don't have any payslips yet. They will appear here once processed by HR.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPayslips.map((payslip) => (
              <div key={payslip.payroll_id || payslip.id}
                className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary-500 transition-all duration-200 cursor-pointer"
                onClick={() => viewPayslip(payslip)}>
                <div className={`absolute top-0 right-0 w-1 h-full rounded-r-xl ${payslip.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                {payslip.is_archived && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                    <FaArchive /> Archived
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 text-xl">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900 leading-tight">
                      {getMonthName(payslip.month || payslip.period_month)} {payslip.year || payslip.period_year}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {payslip.position || payslip.designation || 'Employee'}
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Net Salary</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {currency}{parseFloat(payslip.net_pay || payslip.net_salary).toLocaleString()}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${payslip.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {(payslip.payment_status === 'paid' ? <FaCheckCircle /> : <FaExclamationTriangle />)}
                    <span className="capitalize">{payslip.payment_status || 'pending'}</span>
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {payslip.payment_date ? formatDate(payslip.payment_date, getSetting('date_format')) : 'Pending'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    onClick={(e) => { e.stopPropagation(); viewPayslip(payslip); }}>
                    <FaEye /> View
                  </button>
                  <button className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const id = payslip.id || payslip.payroll_id;
                        const blob = await payrollService.downloadPayslipPdf(id);
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      } catch (err) { setError('Download failed'); }
                    }}>
                    <FaDownload /> PDF
                  </button>
                  <div className="relative group">
                    <button className="px-3 py-2 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50 transition-all"
                      onClick={(e) => e.stopPropagation()}>
                      ...
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 hidden group-hover:block">
                      <button onClick={(e) => { e.stopPropagation(); toggleArchive(payslip); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <FaArchive /> {payslip.is_archived ? 'Unarchive' : 'Archive'}
                      </button>
                      {payslip.is_archived && (
                        <button onClick={(e) => { e.stopPropagation(); requestReissue(payslip); }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <FaRedo /> Request Reissue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedPayslip && (
        <PayslipDetailModal
          payslip={selectedPayslip}
          onClose={() => { setShowModal(false); setSelectedPayslip(null); }}
          onUpdate={loadPayslips}
        />
      )}
    </div>
  );
};

export default MyPayslips;
