import { useState, useEffect } from 'react';
import { attendanceService, employeeService } from '../services';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { useAuth } from '../context/AuthContext';
import {
  FaClock,
  FaCalendarCheck,
  FaUserClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaFilter,
  FaTrash,
  FaEdit,
  FaUser,
  FaCalendarAlt,
  FaSearch,
  FaBuilding
} from 'react-icons/fa';
import AttendanceRegularizationModal from '../components/attendance/AttendanceRegularizationModal';

const Attendance = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRegularizationModal, setShowRegularizationModal] = useState(false);
  const [selectedDateForRegularization, setSelectedDateForRegularization] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Regularization State
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'regularization'
  const [regularizationRequests, setRegularizationRequests] = useState([]);

  const [filters, setFilters] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    status: ''
  });
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '',
    clock_out: '',
    status: 'present',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendance();
    } else {
      loadRegularizationRequests();
    }

    if (user?.role === 'admin' || user?.role === 'manager') {
      loadEmployees();
    }
  }, [activeTab]);

  const loadAttendance = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: page,
        limit: 10
      };

      // For employees, automatically filter by their own employee ID
      if (user?.role === 'employee' && !filters.employee_id) {
        try {
          const employeeResponse = await employeeService.getByUserId(user.userId);
          if (employeeResponse.data) {
            params.employee_id = employeeResponse.data.employee_id;
          }
        } catch (empError) {
          console.error('Failed to get employee ID:', empError);
        }
      }

      const response = await attendanceService.getAll(params);
      setAttendanceRecords(response.data);
      setPagination(response.pagination);
      setError('');
    } catch (error) {
      setError('Failed to load attendance: ' + (error.response?.data?.message || error.message));
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

  const loadRegularizationRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user?.role === 'employee') {
        // If employee, backend might expect an employee_id filter or handle it via token.
        // Usually backend handles "my requests" based on token for employees.
        // But if we need explicit ID:
        const employeeResponse = await employeeService.getByUserId(user.userId);
        if (employeeResponse.data) {
          params.employee_id = employeeResponse.data.employee_id;
        }
      }
      const data = await attendanceService.getRegularizationRequests(params);
      setRegularizationRequests(data.data || []); // Adjust based on actual API response structure
    } catch (err) {
      console.error("Failed to load regularization requests", err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegularization = async (id) => {
    try {
      await attendanceService.updateRegularizationStatus(id, 'approved');
      setSuccess('Request approved successfully');
      loadRegularizationRequests();
    } catch (err) {
      setError('Failed to approve request');
    }
  };

  const handleRejectRegularization = async (id) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await attendanceService.updateRegularizationStatus(id, 'rejected');
      setSuccess('Request rejected');
      loadRegularizationRequests();
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadAttendance(newPage);
    }
  };

  const handleClockIn = async () => {
    // For employees, use their own employee ID
    let employeeId = formData.employee_id;
    if (user?.role === 'employee' && !employeeId) {
      try {
        const employeeResponse = await employeeService.getByUserId(user.userId);
        if (employeeResponse.data) {
          employeeId = employeeResponse.data.employee_id;
        }
      } catch (empError) {
        setError('Failed to get employee ID: ' + empError.message);
        return;
      }
    }

    if (!employeeId) {
      setError('Please select an employee');
      return;
    }

    try {
      await attendanceService.clockIn(employeeId);
      setSuccess('Clocked in successfully!');
      loadAttendance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Clock in failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleClockOut = async () => {
    // For employees, use their own employee ID
    let employeeId = formData.employee_id;
    if (user?.role === 'employee' && !employeeId) {
      try {
        const employeeResponse = await employeeService.getByUserId(user.userId);
        if (employeeResponse.data) {
          employeeId = employeeResponse.data.employee_id;
        }
      } catch (empError) {
        setError('Failed to get employee ID: ' + empError.message);
        return;
      }
    }

    if (!employeeId) {
      setError('Please select an employee');
      return;
    }

    try {
      await attendanceService.clockOut(employeeId);
      setSuccess('Clocked out successfully!');
      loadAttendance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Clock out failed: ' + (error.response?.data?.message || error.message));
    }
  };



  // ... (keeping loadAttendance and loadEmployees same)

  // ... (keeping handlePageChange, handleClockIn, handleClockOut same)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await attendanceService.update(editId, formData);
        setSuccess('Attendance record updated successfully!');
      } else {
        await attendanceService.create(formData);
        setSuccess('Attendance record created successfully!');
      }
      loadAttendance();
      handleCloseModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (record) => {
    setFormData({
      employee_id: record.employee_id,
      date: new Date(record.date).toISOString().split('T')[0],
      clock_in: record.clock_in || '',
      clock_out: record.clock_out || '',
      status: record.status || 'present',
      notes: record.notes || ''
    });
    setEditId(record.attendance_id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceService.delete(id);
        setSuccess('Attendance record deleted!');
        loadAttendance();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setIsEditing(false);
    setEditId(null);
    setFormData({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      clock_in: '',
      clock_out: '',
      status: 'present',
      notes: ''
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilter = () => {
    // Reset to first page when filters change
    loadAttendance(1);
  };

  if (loading) return <div className="loading">Loading...</div>;

  // Calculate quick stats from current page data (or you could fetch real stats from backend)
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  return (
    <div className="w-full" style={{ paddingBottom: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">Track employee attendance, work hours, and punctuality.</p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-primary" onClick={handleClockIn}>
            <FaClock /> Clock In
          </button>
          <button className="btn btn-secondary" onClick={handleClockOut}>
            <FaUserClock /> Clock Out
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Record
          </button>

          {user?.role === 'employee' && (
            <button className="btn btn-secondary" onClick={() => {
              setSelectedDateForRegularization(new Date().toISOString().split('T')[0]);
              setShowRegularizationModal(true);
            }}>
              <FaEdit /> Regularize
            </button>
          )}
        </div>
      </div>


      {/* Tabs */}
      <div className="flex gap-xs mb-8 border-b border-neutral-200">
        <button
          className={`pb-3 px-5 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'attendance' ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'}`}
          onClick={() => setActiveTab('attendance')}
        >
          <FaCalendarCheck className="inline mr-2" /> Attendance Log
        </button>
        <button
          className={`pb-3 px-5 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'regularization' ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'}`}
          onClick={() => setActiveTab('regularization')}
        >
          <FaExclamationTriangle className="inline mr-2" /> Regularization Requests
        </button>
      </div>

      {activeTab === 'attendance' && (
        <>
          {error && <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2"><FaTimesCircle /> {error}</div>}
          {success && <div className="p-4 mb-6 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2"><FaCheckCircle /> {success}</div>}


          {/* Stats Overview */}
          <div className="dashboard-main-grid mb-6">
            <div className="card p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary-50 text-primary-600 rounded-lg border border-primary-50 p-2">
                  <FaCalendarCheck size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Total Records</span>
              </div>
              <div className="mb-1">
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{pagination.totalItems}</h3>
              </div>
              <span className="text-sm font-medium text-neutral-500">entries</span>
            </div>

            <div className="card p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-success-50 text-success rounded-lg border border-success-50 p-2">
                  <FaCheckCircle size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Present</span>
              </div>
              <div className="mb-1">
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{presentCount}</h3>
              </div>
              <span className="text-sm font-medium text-neutral-500">on this page</span>
            </div>

            <div className="card p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-warning-50 text-warning rounded-lg border border-warning-50 p-2">
                  <FaExclamationTriangle size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Late</span>
              </div>
              <div className="mb-1">
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{lateCount}</h3>
              </div>
              <span className="text-sm font-medium text-neutral-500">on this page</span>
            </div>

            <div className="card p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-danger-50 text-danger rounded-lg border border-danger-50 p-2">
                  <FaTimesCircle size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-neutral-400" style={{ fontSize: '10px' }}>Absent</span>
              </div>
              <div className="mb-1">
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{absentCount}</h3>
              </div>
              <span className="text-sm font-medium text-neutral-500">on this page</span>
            </div>
          </div>
          {/* Filters */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Employee Filter (Admin/Manager only) */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <div className="min-w-[200px] flex-grow">
                    <label className="form-label mb-1">Employee</label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                      <select
                        className="form-select pl-9 w-full"
                        name="employee_id"
                        value={filters.employee_id}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.first_name} {emp.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="min-w-[160px]">
                  <label className="form-label mb-1">Start Date</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                    <input
                      type="date"
                      className="form-input pl-9 w-full"
                      name="start_date"
                      value={filters.start_date}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>

                <div className="min-w-[160px]">
                  <label className="form-label mb-1">End Date</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                    <input
                      type="date"
                      className="form-input pl-9 w-full"
                      name="end_date"
                      value={filters.end_date}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>

                <div className="min-w-[150px]">
                  <label className="form-label mb-1">Status</label>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                    <select
                      className="form-select pl-9 w-full"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Statuses</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="leave">On Leave</option>
                      <option value="late">Late</option>
                      <option value="half_day">Half Day</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={handleFilter}>
                    <FaSearch className="mr-2" /> Apply
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setFilters({ employee_id: '', start_date: '', end_date: '', status: '' });
                    loadAttendance(1);
                  }}>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <div className="p-4 bg-neutral-50 rounded-full mb-3">
                          <FaCalendarCheck size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-700 mb-1">No attendance records found</h3>
                        <p className="text-sm">Adjust your filters or add a new record.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record.attendance_id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            {record.employee_name ? record.employee_name.charAt(0) : 'U'}
                          </div>
                          <div className="font-semibold text-neutral-800">{record.employee_name}</div>
                        </div>
                      </td>
                      <td className="font-medium text-neutral-700">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="font-mono text-neutral-600">
                        {record.clock_in || '-'}
                      </td>
                      <td className="font-mono text-neutral-600">
                        {record.clock_out || '-'}
                      </td>
                      <td className="font-mono font-semibold text-neutral-800">
                        {record.work_hours || '-'}
                        {record.work_hours && <span className="text-xs text-neutral-400 ml-1">hrs</span>}
                      </td>
                      <td>
                        <span className={`badge badge-${record.status === 'present' ? 'success' :
                          record.status === 'absent' ? 'danger' :
                            record.status === 'late' ? 'warning' : 'secondary'
                          }`}>
                          {record.status === 'present' && <FaCheckCircle size={10} className="mr-1.5" />}
                          {record.status === 'absent' && <FaTimesCircle size={10} className="mr-1.5" />}
                          {record.status === 'late' && <FaExclamationTriangle size={10} className="mr-1.5" />}
                          <span className="capitalize">{record.status}</span>
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate text-neutral-500">
                        {record.notes || '-'}
                      </td>
                      <td>
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" onClick={() => handleEdit(record)} title="Edit">
                            <FaEdit size={14} />
                          </button>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(record.attendance_id)} title="Delete">
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
        </>
      )}

      {activeTab === 'regularization' && (
        <div className="card p-0">
          <div className="card-header">
            <h3 className="card-title">Regularization Requests</h3>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Original In/Out</th>
                  <th>Requested In/Out</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {(user?.role === 'admin' || user?.role === 'manager') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {regularizationRequests.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-8 text-neutral-400">No regularization requests found.</td></tr>
                ) : (
                  regularizationRequests.map(req => (
                    <tr key={req.regularization_id}>
                      <td className="font-medium text-neutral-800">{req.employee_name}</td>
                      <td className="text-neutral-600">{formatDate(req.date)}</td>
                      <td className="font-mono text-xs text-neutral-500">
                        {req.original_clock_in ? req.original_clock_in.substring(0, 5) : '--:--'} - {req.original_clock_out ? req.original_clock_out.substring(0, 5) : '--:--'}
                      </td>
                      <td className="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded inline-block">
                        {req.requested_clock_in?.substring(0, 5)} - {req.requested_clock_out?.substring(0, 5)}
                      </td>
                      <td className="text-neutral-600 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                      <td>
                        <span className={`badge badge-${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}`}>
                          {req.status}
                        </span>
                      </td>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <td>
                          {req.status === 'pending' && (
                            <div className="flex gap-sm">
                              <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" onClick={() => handleApproveRegularization(req.regularization_id)} title="Approve">
                                <FaCheckCircle size={16} />
                              </button>
                              <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => handleRejectRegularization(req.regularization_id)} title="Reject">
                                <FaTimesCircle size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}





      {/* Add/Edit Record Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{isEditing ? 'Edit Attendance Record' : 'Add Attendance Record'}</h3>
                <p className="text-sm text-neutral-500 mt-0.5">{isEditing ? 'Update attendance details for an employee.' : 'Manually add an attendance entry.'}</p>
              </div>
              <button onClick={handleCloseModal} className="modal-close">
                <FaTimesCircle size={20} />
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="mb-4 p-3 bg-danger-50 text-danger text-sm rounded-lg border border-danger-50 flex items-center gap-2"><FaExclamationTriangle className="shrink-0" /> {error}</div>}

              <form onSubmit={handleSubmit} id="attendanceForm" className="space-y-4">
                <div className="form-group mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Employee <span className="text-danger">*</span></label>
                  <select
                    className="form-input"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    required
                    disabled={isEditing}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Clock In</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.clock_in}
                      onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Clock Out</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.clock_out}
                      onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    placeholder="Optional notes..."
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" form="attendanceForm" className="btn btn-primary">{isEditing ? 'Update Record' : 'Save Record'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Regularization Modal */}
      <AttendanceRegularizationModal
        isOpen={showRegularizationModal}
        onClose={() => setShowRegularizationModal(false)}
        date={selectedDateForRegularization}
        employeeId={attendanceRecords.length > 0 ? attendanceRecords[0].employee_id : user?.employee_id}
        onSuccess={() => {
          setSuccess('Regularization request submitted!');
          if (activeTab === 'regularization') {
            loadRegularizationRequests();
          } else {
            setActiveTab('regularization');
          }
        }}
      />
    </div>
  );
};

export default Attendance;