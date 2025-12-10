import React, { useEffect, useState } from 'react';
import { leaveService, employeeService } from '../services';
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
  FaTrash
} from 'react-icons/fa';

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

  useEffect(() => {
    loadLeaveRequests();
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadEmployees();
    }
    fetchLeaveStatistics();

    // Load leave balance data for the balance tab
    if (user.role === 'employee') {
      loadEmployeeLeaveBalance();
    } else {
      loadAllLeaveBalances();
    }
  }, []);

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

  // Add another useEffect to load leave balances when switching to the balance tab
  useEffect(() => {
    if (activeTab === 'balance' && user.role !== 'employee' && leaveBalances.length === 0) {
      loadAllLeaveBalances();
    }
  }, [activeTab]);

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
    <div className="container" style={{ paddingBottom: '2rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-description">Manage leave requests, balances, and approvals.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'requests' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus /> New Request
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              paddingBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: activeTab === 'requests' ? '#4f46e5' : '#9ca3af',
              borderBottom: activeTab === 'requests' ? '2px solid #4f46e5' : '2px solid transparent',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'requests' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaTasks /> Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            style={{
              paddingBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: activeTab === 'balance' ? '#4f46e5' : '#9ca3af',
              borderBottom: activeTab === 'balance' ? '2px solid #4f46e5' : '2px solid transparent',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'balance' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaBalanceScale /> Leave Balance
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Leave Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: '#e0e7ff', padding: '0.75rem', borderRadius: '0.5rem', color: '#4f46e5' }}>
                  <FaHourglassHalf size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Pending</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{leaveStatistics.pending_requests}</h3>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>requests</span>
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '0.5rem', color: '#059669' }}>
                  <FaCheckCircle size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Approved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{leaveStatistics.approved_requests}</h3>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>requests</span>
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', color: '#dc2626' }}>
                  <FaTimesCircle size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Rejected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{leaveStatistics.rejected_requests}</h3>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>requests</span>
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: '#f3f4f6', padding: '0.75rem', borderRadius: '0.5rem', color: '#4b5563' }}>
                  <FaListAlt size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{leaveStatistics.total_requests}</h3>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>requests</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Filter by Status:</label>
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  loadLeaveRequests(1);
                  fetchLeaveStatistics();
                }}
                style={{ width: '200px' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="table">
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
                    <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <FaCalendarAlt />
                        </div>
                        <h3 className="empty-state-title">No leave requests found</h3>
                        <p className="empty-state-description">Submit a new leave request to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((leave) => (
                    <tr key={leave.leave_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ height: '2rem', width: '2rem', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 'bold', fontSize: '0.75rem', marginRight: '0.75rem' }}>
                            {leave.employee_name.charAt(0)}
                          </div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{leave.employee_name}</div>
                        </div>
                      </td>
                      <td>{leave.department_name || '-'}</td>
                      <td>{leave.leave_type}</td>
                      <td>{formatDate(leave.start_date, getSetting('date_format'))}</td>
                      <td>{formatDate(leave.end_date, getSetting('date_format'))}</td>
                      <td>{leave.days_count}</td>
                      <td title={leave.reason} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leave.reason}
                      </td>
                      <td>
                        <span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}`}>
                          {leave.status === 'approved' && <FaCheckCircle size={10} style={{ marginRight: '4px' }} />}
                          {leave.status === 'rejected' && <FaTimesCircle size={10} style={{ marginRight: '4px' }} />}
                          {leave.status === 'pending' && <FaHourglassHalf size={10} style={{ marginRight: '4px' }} />}
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {leave.status === 'pending' && user.role !== 'employee' && (
                            <>
                              <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleApprove(leave.leave_id)} title="Approve">
                                <FaCheckCircle />
                              </button>
                              <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleReject(leave.leave_id)} title="Reject">
                                <FaTimesCircle />
                              </button>
                            </>
                          )}
                          {leave.status === 'pending' && (
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleEdit(leave)} title="Edit">
                              <FaEdit />
                            </button>
                          )}
                          {user.role !== 'employee' && (
                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(leave.leave_id)} title="Delete">
                              <FaTrash />
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
                    className={`btn ${pageNum === pagination.currentPage ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePageChange(pageNum)}
                    style={{ minWidth: '40px' }}
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

              <span style={{ marginLeft: '1rem', color: '#6b7280' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
                {' '}({pagination.totalItems} total requests)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Leave Balance Tab */}
      {activeTab === 'balance' && (
        <div>
          {user.role !== 'employee' && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode('all')}
                >
                  All Employees
                </button>
                <button
                  className={`btn ${viewMode === 'individual' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode('individual')}
                >
                  Individual Employee
                </button>
              </div>

              {viewMode === 'individual' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Employee</label>
                  <select
                    className="form-input"
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
          )}

          {/* Individual Employee View */}
          {((user.role === 'employee') || (user.role !== 'employee' && viewMode === 'individual' && individualBalance)) && (
            <div>
              {individualBalance && (
                <div>
                  <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #4f46e5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '1.25rem' }}>
                        <FaUser />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {individualBalance.employee.first_name} {individualBalance.employee.last_name}
                        </h2>
                        <div style={{ display: 'flex', gap: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FaBuilding /> {individualBalance.employee.department || 'Not assigned'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FaBriefcase /> {individualBalance.employee.position || 'Not assigned'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '0.5rem', color: '#059669' }}>
                          <FaCheckCircle size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Allocated</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{individualBalance.summary.totalAllocated}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>days</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', color: '#dc2626' }}>
                          <FaTimesCircle size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Used</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{individualBalance.summary.totalUsed}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>days</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#e0e7ff', padding: '0.75rem', borderRadius: '0.5rem', color: '#4f46e5' }}>
                          <FaBalanceScale size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Remaining</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{individualBalance.summary.totalRemaining}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>days</span>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Leave Type Breakdown</h3>
                    </div>
                    <table className="table">
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
                            <td style={{ width: '30%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1, height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${Math.min(100, (balance.used / Math.max(1, balance.allocated)) * 100)}%`,
                                      background: balance.remaining > 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : '#ef4444',
                                      borderRadius: '4px',
                                      transition: 'width 0.5s ease-in-out'
                                    }}
                                  ></div>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '3rem' }}>
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
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
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
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            <FaBalanceScale />
                          </div>
                          <h3 className="empty-state-title">No leave balances found</h3>
                          <p className="empty-state-description">Leave balances will appear here once employees are added.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leaveBalances.map((item) => (
                      <tr key={item.employee.employee_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ height: '2rem', width: '2rem', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 'bold', fontSize: '0.75rem', marginRight: '0.75rem' }}>
                              {item.employee.first_name.charAt(0)}
                            </div>
                            <div style={{ fontWeight: '500', color: '#111827' }}>{item.employee.first_name} {item.employee.last_name}</div>
                          </div>
                        </td>
                        <td>{item.employee.department || '-'}</td>
                        <td>{item.employee.position || '-'}</td>
                        <td>{item.summary.totalAllocated}</td>
                        <td>{item.summary.totalUsed}</td>
                        <td><strong>{item.summary.totalRemaining}</strong></td>
                        <td style={{ width: '25%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min(100, (item.summary.totalUsed / Math.max(1, item.summary.totalAllocated)) * 100)}%`,
                                  background: item.summary.totalRemaining > 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : '#ef4444',
                                  borderRadius: '4px'
                                }}
                              ></div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '3rem' }}>
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
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FaUser />
                </div>
                <h3 className="empty-state-title">Select an employee</h3>
                <p className="empty-state-description">Please select an employee from the dropdown above to view their detailed leave balance.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave Request Modal */}
      {showModal && activeTab === 'requests' && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{editingLeave ? 'Edit Leave Request' : 'New Leave Request'}</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Submit a request for time off.</p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {user.role !== 'employee' && (
                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select className="form-input" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} required>
                    <option value="">Select Employee</option>
                    {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Leave Type *</label>
                  <select className="form-input" value={formData.leave_type} onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })} required>
                    {leaveTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <textarea className="form-input" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows="3" required placeholder="Please provide a reason for your leave request..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingLeave ? 'Update Request' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;