import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService, departmentService, authService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { validatePassword } from '../utils/passwordHelper';

const Employees = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, getSetting } = useSettings();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // For name search
  const [selectedDepartment, setSelectedDepartment] = useState(''); // For department filter
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    address: '',
    department_id: '',
    position: '',
    hire_date: '',
    salary: '',
    employment_type: 'full-time',
    status: 'active',
    password: ''
  });

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  useEffect(() => {
    // When filters change, reset to first page
    loadEmployees(1);
  }, [searchTerm, selectedDepartment]);

  const loadEmployees = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: 10,
        search: searchTerm,
        department_id: selectedDepartment
      };

      const response = await employeeService.getAll(params);
      setEmployees(response.data);
      setPagination(response.pagination);
      setError('');
    } catch (error) {
      setError('Failed to load employees: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadEmployees(newPage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate password if provided
      if (formData.password) {
        const { isValid, errors } = validatePassword(formData.password, settings);
        if (!isValid) {
          setError(errors.join(' '));
          return;
        }
      }

      if (editingEmployee) {
        // Update employee details
        await employeeService.update(editingEmployee.employee_id, formData);

        // If password is provided, update it as well
        if (formData.password) {
          if (window.confirm('Are you sure you want to change this employee\'s password?')) {
            await authService.adminChangeUserPassword(editingEmployee.user_id, formData.password);
            alert('Employee details and password updated successfully');
          }
        } else {
          alert('Employee details updated successfully');
        }
      } else {
        await employeeService.create(formData);
        alert('Employee created successfully');
      }
      loadEmployees();
      handleCloseModal();
    } catch (error) {
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.delete(id);
        loadEmployees();
        setError('');
      } catch (error) {
        setError('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      date_of_birth: employee.date_of_birth || '',
      gender: employee.gender || 'male',
      address: employee.address || '',
      department_id: employee.department_id || '',
      position: employee.position || '',
      hire_date: employee.hire_date || '',
      salary: employee.salary || '',
      employment_type: employee.employment_type || 'full-time',
      status: employee.status || 'active',
      password: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setError('');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      department_id: '',
      position: '',
      hire_date: '',
      salary: '',
      employment_type: 'full-time',
      status: 'active',
      password: ''
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1><i className="fas fa-users"></i> Employees</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><i className="fas fa-plus"></i> Add Employee</button>
        )}
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}

      {/* Search and Filter Section */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label">Search by Name or Email</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label">Department</label>
            <select
              className="form-input"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Position</th>
              <th>Hire Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>
                    <strong>{employee.first_name} {employee.last_name}</strong>
                  </td>
                  <td>{employee.email}</td>
                  <td>{employee.department_name || 'Not assigned'}</td>
                  <td>{employee.position || 'Not specified'}</td>
                  <td>{employee.hire_date ? formatDate(employee.hire_date, getSetting('date_format')) : 'N/A'}</td>
                  <td>
                    <span className={`badge badge-${employee.status === 'active' ? 'success' : 'secondary'}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-info" style={{ fontSize: '0.75rem' }} onClick={() => navigate(`/employees/${employee.employee_id}`)}>View</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => handleEdit(employee)}>Edit</button>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button className="btn btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleDelete(employee.employee_id)}>Delete</button>
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
            {' '}({pagination.totalItems} total employees)
          </span>
        </div>
      )}

      {/* Employee Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
            {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-input" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-input" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input type="text" className="form-input" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Hire Date *</label>
                  <input type="date" className="form-input" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Salary</label>
                  <input type="number" className="form-input" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Employment Type</label>
                  <select className="form-input" value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Password {editingEmployee ? '(optional)' : '*'}</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingEmployee}
                  />
                  <small className="form-text">Minimum 6 characters</small>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">{editingEmployee ? 'Update' : 'Create'}</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;