import React, { useEffect, useState } from 'react';
import { leaveService, employeeService, holidayService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import {
  FaCalendarAlt,
  FaPlus,
  FaSync,
  FaTasks,
  FaBalanceScale,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaListAlt,
  FaUser,
  FaBuilding,
  FaBriefcase,
  FaEdit,
  FaTrash,
  FaGift,
  FaUmbrellaBeach,
  FaPlane
} from 'react-icons/fa';
import CompOffRequestModal from '../components/leaves/CompOffRequestModal';

const Leaves = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'balance'
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveStatistics, setLeaveStatistics] = useState({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCompOffModal, setShowCompOffModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'Sick Leave',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [individualBalance, setIndividualBalance] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'individual'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [holidays, setHolidays] = useState([]);
  const [myRestrictedHolidays, setMyRestrictedHolidays] = useState([]);
  const [compOffRequests, setCompOffRequests] = useState([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

  useEffect(() => {
    // Initial load
    if (activeTab === 'requests') loadLeaveRequests();

    // Fetch current employee ID if user is employee
    const fetchEmployeeId = async () => {
      if (user.role === 'employee') {
        try {
          const emp = await employeeService.getByUserId(user.userId);
          setCurrentEmployeeId(emp.data.employee_id);
        } catch (e) {
          console.error("Failed to fetch employee ID", e);
        }
      }
    };
    fetchEmployeeId();

    if (user?.role === 'admin' || user?.role === 'manager') {
      loadEmployees();
    }
    fetchLeaveStatistics();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') loadLeaveRequests();
    if (activeTab === 'balance') {
      if (user.role === 'employee') loadEmployeeLeaveBalance();
      else loadAllLeaveBalances();
    }
    if (activeTab === 'holidays' && holidays.length === 0) loadHolidays();
    if (activeTab === 'comp-off') loadCompOffRequests();
  }, [activeTab]);

  const fetchLeaveStatistics = async () => {
    try {
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      const response = await leaveService.getStatistics(params);
      setLeaveStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch leave statistics:', error);
    }
  };



  const loadHolidays = async () => {
    try {
      const year = new Date().getFullYear();
      const response = await holidayService.getAll(year);
      setHolidays(response.data);

      if (user.role === 'employee' || user.role === 'admin') {
        // Fetch my restricted holidays usage if relevant
        // For now, simpler implementation:
        if (user.role === 'employee') {
          try {
            const employeeResponse = await employeeService.getByUserId(user.userId);
            const myRh = await holidayService.getMyRestricted(year, employeeResponse.data.employee_id);
            setMyRestrictedHolidays(myRh.data.map(h => h.holiday_id)); // Store IDs for easy check
          } catch (e) {
            console.error("Failed to load my restricted holidays", e);
          }
        }
      }
    } catch (error) {
      setError('Failed to load holidays');
    }
  };

  const handleOptInRH = async (holiday) => {
    try {
      if (!currentEmployeeId) return;
      await holidayService.optIn(currentEmployeeId, holiday.holiday_id);
      setSuccess(`Successfully opted in for ${holiday.name}`);
      loadHolidays(); // Reload to update status
    } catch (error) {
      setError('Failed to opt-in: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadCompOffRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user.role === 'employee') {
        if (currentEmployeeId) params.employee_id = currentEmployeeId;
        else {
          // Fallback if not set yet
          const emp = await employeeService.getByUserId(user.userId);
          params.employee_id = emp.data.employee_id;
          setCurrentEmployeeId(emp.data.employee_id);
        }
      }
      const response = await leaveService.getCompOffRequests(params);
      setCompOffRequests(response.data);
    } catch (err) {
      setError("Failed to load comp-off requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCompOff = async (id) => {
    try {
      await leaveService.updateCompOffStatus(id, 'approved');
      setSuccess('Comp-off request approved');
      loadCompOffRequests();
    } catch (e) {
      setError('Failed to approve');
    }
  };

  const handleRejectCompOff = async (id) => {
    if (!window.confirm("Reject comp-off request?")) return;
    try {
      await leaveService.updateCompOffStatus(id, 'rejected');
      setSuccess('Comp-off request rejected');
      loadCompOffRequests();
    } catch (e) {
      setError('Failed to reject');
    }
  };

  const loadLeaveRequests = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await leaveService.getAll(params);
      setLeaveRequests(response.data);
      setPagination(response.pagination);
      fetchLeaveStatistics(); // Fetch updated statistics when loading requests
      setError('');
    } catch (error) {
      setError('Failed to load leave requests: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadAllLeaveBalances = async () => {
    try {
      const response = await leaveService.getAllBalances();
      setLeaveBalances(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load leave balances: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadEmployeeLeaveBalance = async () => {
    try {
      // Get employee ID from user
      const employeeResponse = await employeeService.getByUserId(user.userId);
      if (employeeResponse.data) {
        const response = await leaveService.getBalance(employeeResponse.data.employee_id);
        setIndividualBalance(response.data);
      }
      setError('');
    } catch (error) {
      setError('Failed to load leave balance: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEmployeeChange = async (e) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);

    if (employeeId) {
      try {
        const response = await leaveService.getBalance(employeeId);
        setIndividualBalance(response.data);
        setError('');
      } catch (error) {
        setError('Failed to load leave balance: ' + (error.response?.data?.message || error.message));
        setIndividualBalance(null);
      }
    } else {
      setIndividualBalance(null);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'requests') {
      loadLeaveRequests();
    } else {
      if (user.role === 'employee') {
        loadEmployeeLeaveBalance();
      } else {
        if (viewMode === 'all') {
          loadAllLeaveBalances();
        } else if (selectedEmployee) {
          handleEmployeeChange({ target: { value: selectedEmployee } });
        }
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadLeaveRequests(newPage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingLeave) {
        await leaveService.update(editingLeave.leave_id, formData);
        setSuccess('Leave request updated successfully!');
      } else {
        await leaveService.create(formData);
        setSuccess('Leave request submitted successfully!');
      }
      loadLeaveRequests();
      handleCloseModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApprove = async (id) => {
    if (user.role !== 'admin' && user.role !== 'manager') {
      setError('Only admins and managers can approve leave requests');
      return;
    }

    try {
      await leaveService.approve(id);
      setSuccess('Leave request approved!');
      loadLeaveRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Approve failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (id) => {
    if (user.role !== 'admin' && user.role !== 'manager') {
      setError('Only admins and managers can reject leave requests');
      return;
    }

    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await leaveService.reject(id, reason);
      setSuccess('Leave request rejected!');
      loadLeaveRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Reject failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await leaveService.delete(id);
        setSuccess('Leave request deleted!');
        loadLeaveRequests();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (leave) => {
    if (leave.status !== 'pending') {
      setError('Can only edit pending leave requests');
      return;
    }
    setEditingLeave(leave);
    setFormData({
      employee_id: leave.employee_id,
      leave_type: leave.leave_type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLeave(null);
    setError('');
    setFormData({
      employee_id: '',
      leave_type: 'Sick Leave',
      start_date: '',
      end_date: '',
      reason: ''
    });
  };

  if (loading && activeTab === 'requests') return <div className="loading">Loading...</div>;

  const leaveTypes = ['Sick Leave', 'Casual Leave', 'Vacation', 'Maternity Leave', 'Paternity Leave'];

  return (
    <div className="w-full" style={{ paddingBottom: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="mt-1 text-neutral-600">Manage leave requests, balances, policies and approvals.</p>
        </div>
        <div className="flex gap-sm">
          {activeTab === 'requests' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus className="mr-2" /> New Request
            </button>
          )}
          {activeTab === 'requests' && user.role === 'employee' && (
            <button className="btn btn-secondary" onClick={() => setShowCompOffModal(true)}>
              <FaGift className="mr-2" /> Request Comp-Off
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <FaSync className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 overflow-x-auto">
        <button
          className={`pb-3 px-5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'requests' ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'}`}
          onClick={() => setActiveTab('requests')}
        >
          <FaTasks /> Leave Requests
        </button>
        <button
          className={`pb-3 px-5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'balance' ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'}`}
          onClick={() => setActiveTab('balance')}
        >
          <FaBalanceScale /> Leave Balance
        </button>
        <button
          className={`pb-3 px-5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'holidays' ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'}`}
          onClick={() => setActiveTab('holidays')}
        >
          <FaUmbrellaBeach /> Holidays
        </button>
        <button
          className={`pb-3 px-5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'comp-off' ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'}`}
          onClick={() => setActiveTab('comp-off')}
        >
          <FaGift /> Comp-Offs
        </button>
        <button
          className={`pb-3 px-5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'policies' ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'}`}
          onClick={() => setActiveTab('policies')}
        >
          <FaBalanceScale /> Policies
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Leave Requests Tab */}
      {
        activeTab === 'requests' && (
          <div>
            {/* Statistics */}
            <div className="dashboard-main-grid mb-6">
              <div className="card p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary-50 text-primary-600 rounded-lg border border-primary-50 p-2">
                    <FaHourglassHalf size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Pending</span>
                </div>
                <div className="mb-1">
                  <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{leaveStatistics.pending_requests}</h3>
                </div>
                <span className="text-sm font-medium text-neutral-500">requests</span>
              </div>

              <div className="card p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-success-50 text-success rounded-lg border border-success-50 p-2">
                    <FaCheckCircle size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Approved</span>
                </div>
                <div className="mb-1">
                  <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{leaveStatistics.approved_requests}</h3>
                </div>
                <span className="text-sm font-medium text-neutral-500">requests</span>
              </div>

              <div className="card p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-danger-50 text-danger rounded-lg border border-danger-50 p-2">
                    <FaTimesCircle size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Rejected</span>
                </div>
                <div className="mb-1">
                  <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{leaveStatistics.rejected_requests}</h3>
                </div>
                <span className="text-sm font-medium text-neutral-500">requests</span>
              </div>

              <div className="card p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-neutral-100 text-neutral-600 rounded-lg border border-neutral-200 p-2">
                    <FaListAlt size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Total</span>
                </div>
                <div className="mb-1">
                  <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{leaveStatistics.total_requests}</h3>
                </div>
                <span className="text-sm font-medium text-neutral-500">requests</span>
              </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
              <div className="p-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <FaListAlt className="text-neutral-400" />
                  <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Filter Requests</span>
                </div>
              </div>
              <div className="p-5 flex items-center gap-4">
                <label className="text-sm font-medium text-neutral-700 whitespace-nowrap">Status:</label>
                <select
                  className="w-full md:w-64 p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    loadLeaveRequests(1);
                    fetchLeaveStatistics();
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="card p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-neutral-400">
                          <div className="p-4 bg-neutral-50 rounded-full mb-3">
                            <FaCalendarAlt size={32} />
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-700 mb-1">No leave requests found</h3>
                          <p className="text-sm">Submit a new leave request to get started.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((leave) => (
                      <tr key={leave.leave_id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-semibold text-sm">
                              {leave.employee_name.charAt(0)}
                            </div>
                            <div className="font-semibold text-neutral-800">{leave.employee_name}</div>
                          </div>
                        </td>
                        <td>{leave.department_name || '-'}</td>
                        <td>{leave.leave_type}</td>
                        <td>{formatDate(leave.start_date, getSetting('date_format'))}</td>
                        <td>{formatDate(leave.end_date, getSetting('date_format'))}</td>
                        <td>{leave.days_count}</td>
                        <td className="max-w-[200px] truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td>
                          <span className={`badge ${leave.status === 'approved' ? 'badge-success' : leave.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {leave.status === 'approved' && <FaCheckCircle size={10} style={{ marginRight: '4px' }} />}
                            {leave.status === 'rejected' && <FaTimesCircle size={10} style={{ marginRight: '4px' }} />}
                            {leave.status === 'pending' && <FaHourglassHalf size={10} style={{ marginRight: '4px' }} />}
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {leave.status === 'pending' && user.role !== 'employee' && (
                              <>
                                <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" onClick={() => handleApprove(leave.leave_id)} title="Approve">
                                  <FaCheckCircle size={14} />
                                </button>
                                <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => handleReject(leave.leave_id)} title="Reject">
                                  <FaTimesCircle size={14} />
                                </button>
                              </>
                            )}
                            {leave.status === 'pending' && (
                              <button className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" onClick={() => handleEdit(leave)} title="Edit">
                                <FaEdit size={14} />
                              </button>
                            )}
                            {user.role !== 'employee' && (
                              <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(leave.leave_id)} title="Delete">
                                <FaTrash size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </button>

                {/* Numbered page buttons */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`btn ${pageNum === pagination.currentPage ? 'btn-primary' : 'btn-secondary'} min-w-[40px] px-3`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </button>

                <span className="text-sm font-medium text-neutral-500 ml-4">
                  Page {pagination.currentPage} of {pagination.totalPages} <span className="text-neutral-400">({pagination.totalItems} total)</span>
                </span>
              </div>
            )}
          </div>
        )
      }

      {/* Leave Balance Tab */}
      {
        activeTab === 'balance' && (
          <div>
            {user.role !== 'employee' && (
              <div className="card mb-8">
                <div className="flex gap-4 mb-4">
                  <button
                    className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('all')}
                  >
                    All Employees
                  </button>
                  <button
                    className={`btn ${viewMode === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('individual')}
                  >
                    Individual Employee
                  </button>
                </div>

                {viewMode === 'individual' && (
                  <div className="form-group mb-0">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">Select Employee</label>
                    <select
                      className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                      value={selectedEmployee}
                      onChange={handleEmployeeChange}
                    >
                      <option value="">Select an employee</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.first_name} {emp.last_name} - {emp.position}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
            }

            {/* Individual Employee View */}
            {((user.role === 'employee') || (user.role !== 'employee' && viewMode === 'individual' && individualBalance)) && (
              <div>
                {individualBalance && (
                  <div>
                    <div className="card border-l-4 border-l-primary-600 mb-8 p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-semibold text-lg">
                        {individualBalance.employee.first_name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-neutral-900">
                          {individualBalance.employee.first_name} {individualBalance.employee.last_name}
                        </h2>
                        <div className="flex gap-4 text-neutral-500 text-sm mt-1">
                          <span className="flex items-center gap-1.5"><FaBuilding /> {individualBalance.employee.department || 'Not assigned'}</span>
                          <span className="flex items-center gap-1.5"><FaBriefcase /> {individualBalance.employee.position || 'Not assigned'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="card p-5">
                        <div className="flex justify-between items-center mb-4">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FaCheckCircle size={20} />
                          </div>
                          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Allocated</span>
                        </div>
                        <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-bold text-neutral-900 leading-none">{individualBalance.summary.totalAllocated}</h3>
                          <span className="text-sm font-medium text-neutral-500 mb-1">days</span>
                        </div>
                      </div>
                      <div className="card p-5">
                        <div className="flex justify-between items-center mb-4">
                          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                            <FaTimesCircle size={20} />
                          </div>
                          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Used</span>
                        </div>
                        <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-bold text-neutral-900 leading-none">{individualBalance.summary.totalUsed}</h3>
                          <span className="text-sm font-medium text-neutral-500 mb-1">days</span>
                        </div>
                      </div>
                      <div className="card p-5">
                        <div className="flex justify-between items-center mb-4">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FaBalanceScale size={20} />
                          </div>
                          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Remaining</span>
                        </div>
                        <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-bold text-neutral-900 leading-none">{individualBalance.summary.totalRemaining}</h3>
                          <span className="text-sm font-medium text-neutral-500 mb-1">days</span>
                        </div>
                      </div>
                    </div>

                    <div className="card p-0">
                      <div className="px-6 py-4 border-b border-neutral-100">
                        <h3 className="font-semibold text-neutral-800">Leave Type Breakdown</h3>
                      </div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Leave Type</th>
                            <th>Allocated</th>
                            <th>Used</th>
                            <th>Remaining</th>
                            <th>Utilization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(individualBalance.leaveBalance).map(([leaveType, balance]) => (
                            <tr key={leaveType}>
                              <td><strong>{leaveType}</strong></td>
                              <td>{balance.allocated}</td>
                              <td>{balance.used}</td>
                              <td><strong>{balance.remaining}</strong></td>
                              <td className="w-[30%]">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(100, (balance.used / Math.max(1, balance.allocated)) * 100)}%`,
                                        background: balance.remaining > 0 ? 'var(--success)' : 'var(--danger)'
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-neutral-500 w-8 text-right">
                                    {balance.allocated > 0 ? Math.round((balance.used / balance.allocated) * 100) : 0}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Employees View */}
            {user.role !== 'employee' && viewMode === 'all' && (
              <div className="card p-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Allocated</th>
                      <th>Used</th>
                      <th>Remaining</th>
                      <th>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveBalances.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-neutral-500">
                          <div className="flex flex-col items-center">
                            <div className="p-4 bg-neutral-50 rounded-full mb-3">
                              <FaBalanceScale size={24} className="text-neutral-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-700">No leave balances found</h3>
                            <p className="text-sm">Leave balances will appear here once employees are added.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      leaveBalances.map((item) => (
                        <tr key={item.employee.employee_id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-semibold text-xs">
                                {item.employee.first_name.charAt(0)}
                              </div>
                              <div className="font-medium text-neutral-900">{item.employee.first_name} {item.employee.last_name}</div>
                            </div>
                          </td>
                          <td>{item.employee.department || '-'}</td>
                          <td>{item.employee.position || '-'}</td>
                          <td>{item.summary.totalAllocated}</td>
                          <td>{item.summary.totalUsed}</td>
                          <td><strong className="text-neutral-900">{item.summary.totalRemaining}</strong></td>
                          <td style={{ width: '25%' }}>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, (item.summary.totalUsed / Math.max(1, item.summary.totalAllocated)) * 100)}%`,
                                    background: item.summary.totalRemaining > 0 ? 'var(--success)' : 'var(--danger)'
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-neutral-500 w-8 text-right">
                                {item.summary.totalAllocated > 0 ? Math.round((item.summary.totalUsed / item.summary.totalAllocated) * 100) : 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {user.role !== 'employee' && viewMode === 'individual' && !selectedEmployee && (
              <div className="card p-12 text-center text-neutral-500 flex flex-col items-center">
                <div className="p-4 bg-neutral-50 rounded-full mb-3">
                  <FaUser size={24} className="text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">Select an employee</h3>
                <p className="text-sm">Please select an employee from the dropdown above to view their detailed leave balance.</p>
              </div>
            )}
          </div>
        )
      }

      {/* Leave Request Modal */}
      {/* Leave Request Modal */}
      {
        showModal && activeTab === 'requests' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800">{editingLeave ? 'Edit Leave Request' : 'New Leave Request'}</h2>
                  <p className="text-xs text-neutral-500">Submit a request for time off.</p>
                </div>
                <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                  <FaTimesCircle size={20} />
                </button>
              </div>

              <div className="p-6">
                {error && <div className="alert alert-error mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {user.role !== 'employee' && (
                    <div className="form-group mb-4">
                      <label className="form-label mb-1 block">Employee <span className="text-danger">*</span></label>
                      <select
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Leave Type <span className="text-red-500">*</span></label>
                      <select
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                        value={formData.leave_type}
                        onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                        required
                      >
                        {leaveTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">End Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Reason <span className="text-red-500">*</span></label>
                    <textarea
                      className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows="3"
                      required
                      placeholder="Please provide a reason for your leave request..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{editingLeave ? 'Update Request' : 'Submit Request'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
      {/* Holidays Tab */}
      {
        activeTab === 'holidays' && (
          <div class="card p-0">
            <div className="p-5 border-b border-neutral-100">
              <h3 className="text-lg font-semibold text-neutral-800">Holiday Calendar {new Date().getFullYear()}</h3>
            </div>
            <div className="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Holiday</th>
                    <th>Type</th>
                    <th>Description</th>
                    {user.role === 'employee' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {holidays.map(holiday => (
                    <tr key={holiday.holiday_id}>
                      <td>{formatDate(holiday.date, getSetting('date_format'))}</td>
                      <td className="font-medium text-neutral-800">{holiday.name}</td>
                      <td>
                        <span className={`badge ${holiday.type === 'mandatory' ? 'badge-primary' : 'badge-warning'}`}>
                          {holiday.type === 'mandatory' ? 'Mandatory' : 'Restricted (Optional)'}
                        </span>
                      </td>
                      <td className="text-neutral-500">{holiday.description || '-'}</td>
                      {user.role === 'employee' && (
                        <td>
                          {holiday.type === 'restricted' && (
                            myRestrictedHolidays.includes(holiday.holiday_id) ? (
                              <span className="text-emerald-600 font-medium flex items-center gap-1 text-sm"><FaCheckCircle /> Opted-In</span>
                            ) : (
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleOptInRH(holiday)}
                              >
                                Opt-In
                              </button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {holidays.length === 0 && (
                    <tr>
                      <td colSpan={user.role === 'employee' ? 5 : 4} className="text-center py-8 text-neutral-500">
                        No holidays found for this year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Comp-Off Tab */}
      {
        activeTab === 'comp-off' && (
          <div className="card p-0">
            <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-neutral-800">Compensatory Off Requests</h3>
              {user.role === 'employee' && (
                <button className="btn btn-primary btn-xs" onClick={() => setShowCompOffModal(true)}>
                  <FaPlus className="mr-2" /> New Request
                </button>
              )}
            </div>

            {compOffRequests.length === 0 ? (
              <div className="empty-state p-12 text-center text-neutral-500">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-neutral-50 rounded-full mb-3">
                    <FaGift size={24} className="text-neutral-400" />
                  </div>
                  <p>No comp-off requests found.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Worked Date</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Expiry</th>
                      {(user.role === 'admin' || user.role === 'manager') && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {compOffRequests.map(req => (
                      <tr key={req.request_id}>
                        <td className="font-medium text-neutral-900">{req.employee_name}</td>
                        <td>{formatDate(req.worked_date, getSetting('date_format'))}</td>
                        <td>{req.reason}</td>
                        <td><span className={`badge ${req.status === 'approved' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{req.status}</span></td>
                        <td>{req.expiry_date ? formatDate(req.expiry_date, getSetting('date_format')) : '-'}</td>
                        {(user.role === 'admin' || user.role === 'manager') && (
                          <td>
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" onClick={() => handleApproveCompOff(req.request_id)}><FaCheckCircle size={14} /></button>
                                <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => handleRejectCompOff(req.request_id)}><FaTimesCircle size={14} /></button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      }

      {/* Policies Tab */}
      {
        activeTab === 'policies' && (
          <div className="dashboard-main-grid">
            <div className="card p-4 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2"><FaUser className="text-primary-600" /> Sick Leave (SL)</h3>
              <p className="text-sm text-neutral-600 mb-4 h-10">Granted for medical reasons. Medical certificate required for &gt; 2 days.</p>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <div className="flex justify-between text-sm mb-2 text-neutral-700"><span>Annual Allocation:</span> <strong className="text-neutral-900">10 Days</strong></div>
                <div className="flex justify-between text-sm text-neutral-700"><span>Carry Forward:</span> <strong className="text-neutral-900">No</strong></div>
              </div>
            </div>

            <div className="card p-4 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2"><FaUmbrellaBeach style={{ color: 'var(--warning)' }} /> Casual Leave (CL)</h3>
              <p className="text-sm text-neutral-600 mb-4 h-10">For personal matters. Cannot combine with Earned Leave.</p>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <div className="flex justify-between text-sm mb-2 text-neutral-700"><span>Annual Allocation:</span> <strong className="text-neutral-900">12 Days</strong></div>
                <div className="flex justify-between text-sm text-neutral-700"><span>Max Consecutive:</span> <strong className="text-neutral-900">3 Days</strong></div>
              </div>
            </div>

            <div className="card p-4 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2"><FaPlane className="text-info-600" /> Earned/Privilege Leave <span className="text-xs text-neutral-400 font-normal ml-auto">(EL/PL)</span></h3>
              <p className="text-sm text-neutral-600 mb-4 h-10">Planned vacation. Must be applied 14 days in advance.</p>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <div className="flex justify-between text-sm mb-2 text-neutral-700"><span>Annual Allocation:</span> <strong className="text-neutral-900">20 Days</strong></div>
                <div className="flex justify-between text-sm text-neutral-700"><span>Carry Forward:</span> <strong className="text-neutral-900">Yes (Max 45)</strong></div>
              </div>
            </div>

            <div className="card p-4 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2"><FaGift style={{ color: '#a855f7' }} /> Compensatory Off <span className="text-xs text-neutral-400 font-normal ml-auto">(Comp-Off)</span></h3>
              <p className="text-sm text-neutral-600 mb-4 h-10">Granted for working on weekends or holidays with approval.</p>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <div className="flex justify-between text-sm mb-2 text-neutral-700"><span>Validity:</span> <strong className="text-neutral-900">60 Days</strong></div>
                <div className="flex justify-between text-sm text-neutral-700"><span>Approval:</span> <strong className="text-neutral-900">Manager Required</strong></div>
              </div>
            </div>
          </div>
        )
      }

      {/* Regularization/Comp-Off Modal */}
      <CompOffRequestModal
        isOpen={showCompOffModal}
        onClose={() => setShowCompOffModal(false)}
        employeeId={currentEmployeeId}
        onSuccess={() => {
          setSuccess('Comp-off request submitted successfully!');
          if (activeTab === 'comp-off') loadCompOffRequests();
          else setActiveTab('comp-off');
        }}
      />
    </div >
  );
};

export default Leaves;