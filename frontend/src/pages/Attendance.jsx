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
  FaTrash
} from 'react-icons/fa';

const Attendance = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    loadAttendance();
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadEmployees();
    }
  }, []);

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
    <div className="container" style={{ paddingBottom: '2rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-description">Track employee attendance, work hours, and punctuality.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={handleClockIn}>
            <FaClock /> Clock In
          </button>
          <button className="btn btn-secondary" onClick={handleClockOut}>
            <FaUserClock /> Clock Out
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus /> Add Record
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats Overview (Visible to all) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#e0e7ff', padding: '0.75rem', borderRadius: '0.5rem', color: '#4f46e5' }}>
              <FaCalendarCheck size={20} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Total Records</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{pagination.totalItems}</h3>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>entries</span>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '0.5rem', color: '#059669' }}>
              <FaCheckCircle size={20} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Present</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{presentCount}</h3>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>on this page</span>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '0.5rem', color: '#d97706' }}>
              <FaExclamationTriangle size={20} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Late</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{lateCount}</h3>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>on this page</span>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', color: '#dc2626' }}>
              <FaTimesCircle size={20} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{absentCount}</h3>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>on this page</span>
          </div>
        </div>
      </div>

      {/* Quick Clock In/Out & Filters */}
      <div className="grid grid-cols-1" style={{ marginBottom: '1.5rem' }}>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Filters & Actions</h3>
              <button className="btn btn-outline" onClick={handleFilter} style={{ fontSize: '0.875rem' }}>
                <FaFilter /> Apply Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Employee</label>
                <select className="form-input" value={filters.employee_id} onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}>
                  <option value="">All Employees</option>
                  {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">From Date</label>
                <input type="date" className="form-input" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">To Date</label>
                <input type="date" className="form-input" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Records Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Notes</th>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <th style={{ textAlign: 'right' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={(user?.role === 'admin' || user?.role === 'manager') ? "8" : "7"} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaCalendarCheck />
                    </div>
                    <h3 className="empty-state-title">No attendance records found</h3>
                    <p className="empty-state-description">Try adjusting your filters or add a new record.</p>
                  </div>
                </td>
              </tr>
            ) : (
              attendanceRecords.map((record) => (
                <tr key={record.attendance_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ height: '2rem', width: '2rem', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 'bold', fontSize: '0.75rem', marginRight: '0.75rem' }}>
                        {record.employee_name.charAt(0)}
                      </div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{record.employee_name}</div>
                    </div>
                  </td>
                  <td>{formatDate(record.date, getSetting('date_format'))}</td>
                  <td style={{ fontFamily: 'monospace' }}>{record.clock_in || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{record.clock_out || '-'}</td>
                  <td>
                    {record.hours_worked ? (
                      <span style={{ fontWeight: '500', color: '#111827' }}>{parseFloat(record.hours_worked).toFixed(2)} hrs</span>
                    ) : '-'}
                  </td>
                  <td>
                    <span className={`badge badge-${record.status === 'present' ? 'success' : record.status === 'absent' ? 'danger' : record.status === 'late' ? 'warning' : 'secondary'}`}>
                      {record.status === 'present' && <FaCheckCircle size={10} style={{ marginRight: '4px' }} />}
                      {record.status === 'absent' && <FaTimesCircle size={10} style={{ marginRight: '4px' }} />}
                      {record.status === 'late' && <FaExclamationTriangle size={10} style={{ marginRight: '4px' }} />}
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>
                    {record.notes || '-'}
                  </td>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: '0.5rem' }} onClick={() => handleEdit(record)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(record.attendance_id)}>
                        <FaTrash />
                      </button>
                    </td>
                  )}
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
            {' '}({pagination.totalItems} total records)
          </span>
        </div>
      )}

      {/* Add/Edit Record Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{isEditing ? 'Edit Attendance Record' : 'Add Attendance Record'}</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{isEditing ? 'Update attendance details for an employee.' : 'Manually add an attendance entry for an employee.'}</p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select className="form-input" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} required disabled={isEditing}>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Clock In</label>
                  <input type="time" className="form-input" value={formData.clock_in} onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Clock Out</label>
                  <input type="time" className="form-input" value={formData.clock_out} onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" placeholder="Optional notes..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{isEditing ? 'Update Record' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;