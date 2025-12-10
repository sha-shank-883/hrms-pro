import React, { useEffect, useState } from 'react';
import { taskService, employeeService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';

const Tasks = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    department_id: '',
    assigned_to: '',
    search: ''
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);
  const [taskUpdates, setTaskUpdates] = useState([]);
  const [updateFormData, setUpdateFormData] = useState({
    update_text: '',
    hours_spent: '',
    progress_percentage: '',
    status: '',
    attachments: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    department_id: '',
    estimated_hours: '',
    assigned_employees: [],
    category: 'general'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });
  const [taskStatistics, setTaskStatistics] = useState({
    total_tasks: 0,
    todo_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0
  });

  // Fetch tasks and statistics on component mount
  useEffect(() => {
    fetchTasks();
    fetchTaskStatistics();
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchEmployees();
      fetchDepartments();
    }
  }, [pagination.currentPage]);

  useEffect(() => {
    // Filter employees based on selected department
    if (formData.department_id) {
      const filtered = employees.filter(emp => emp.department_id === formData.department_id || emp.department_id === parseInt(formData.department_id));
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [formData.department_id, employees]);

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: 10,
        ...filters
      };

      const response = await taskService.getAll(params);
      setTasks(response.data);
      setPagination(response.pagination);
      setError('');
    } catch (error) {
      // If it's a 401 error (unauthorized), the API interceptor will handle redirect to login
      if (error.response?.status === 401) {
        console.error('Authentication expired, redirecting to login...');
        // The redirect should be handled by the API interceptor and AuthContext
        // No need to set error state as we're redirecting
        return;
      }
      setError('Failed to load tasks: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll({ limit: 1000 });
      setEmployees(response.data);
    } catch (error) {
      // If it's a 401 error (unauthorized), the API interceptor will handle redirect to login
      if (error.response?.status === 401) {
        console.error('Authentication expired, redirecting to login...');
        // The redirect should be handled by the API interceptor and AuthContext
        // No need to set error state as we're redirecting
        return;
      }
      console.error('Failed to load employees:', error);
      // Only show error to user if it's not an auth issue (which should redirect)
      setError('Failed to load employees: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      // If it's a 401 error (unauthorized), the API interceptor will handle redirect to login
      if (error.response?.status === 401) {
        console.error('Authentication expired, redirecting to login...');
        // The redirect should be handled by the API interceptor and AuthContext
        // No need to set error state as we're redirecting
        return;
      }
      console.error('Failed to load departments:', error);
      // Only show error to user if it's not an auth issue (which should redirect)
      setError('Failed to load departments: ' + (error.response?.data?.message || error.message));
    }
  };

  // Fetch task statistics
  const fetchTaskStatistics = async () => {
    try {
      const response = await taskService.getStatistics();
      setTaskStatistics(response.data);
    } catch (error) {
      // If it's a 401 error (unauthorized), the API interceptor will handle redirect to login
      if (error.response?.status === 401) {
        console.error('Authentication expired, redirecting to login...');
        // The redirect should be handled by the API interceptor and AuthContext
        // No need to set error state as we're redirecting
        return;
      }
      console.error('Failed to fetch task statistics:', error);
      // Only show error to user if it's not an auth issue (which should redirect)
      setError('Failed to fetch task statistics: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    // Reset to first page when applying filters
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    fetchTasks(1);
    fetchTaskStatistics(); // Fetch updated statistics when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      department_id: '',
      assigned_to: '',
      search: ''
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTasks(newPage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingTask) {
        await taskService.update(editingTask.task_id, formData);
        setSuccess('Task updated successfully!');
      } else {
        await taskService.create(formData);
        setSuccess('Task created successfully!');
      }
      fetchTasks();
      handleCloseModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.delete(id);
        setSuccess('Task deleted!');
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.task_id === taskId);
      await taskService.update(taskId, { ...task, status: newStatus });
      setSuccess('Task status updated!');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Status update failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || '',
      department_id: task.department_id || '',
      estimated_hours: task.estimated_hours || '',
      assigned_employees: task.assigned_employee_ids || [],
      category: task.category || 'general'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setError('');
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      due_date: '',
      department_id: '',
      estimated_hours: '',
      assigned_employees: [],
      category: 'general'
    });
  };

  const toggleEmployee = (empId) => {
    const newAssigned = formData.assigned_employees.includes(empId)
      ? formData.assigned_employees.filter(id => id !== empId)
      : [...formData.assigned_employees, empId];
    setFormData({ ...formData, assigned_employees: newAssigned });
  };

  const handleViewUpdates = async (task) => {
    setSelectedTaskForUpdate(task);
    try {
      const response = await taskService.getUpdates(task.task_id);
      setTaskUpdates(response.data);
      setShowUpdateModal(true);
    } catch (error) {
      setError('Failed to load task updates: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTaskForUpdate) return;

    try {
      await taskService.addUpdate(selectedTaskForUpdate.task_id, {
        ...updateFormData
        // employee_id is now determined on the backend from the authenticated user
      });
      setSuccess('Update added successfully!');

      // Reload updates
      const response = await taskService.getUpdates(selectedTaskForUpdate.task_id);
      setTaskUpdates(response.data);

      // Reset form
      setUpdateFormData({
        update_text: '',
        hours_spent: '',
        progress_percentage: '',
        status: '',
        attachments: ''
      });

      // Reload tasks to update progress
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to add update: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedTaskForUpdate(null);
    setTaskUpdates([]);
    setError('');
  };

  if (loading) return <div className="loading">Loading...</div>;

  const priorityColors = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1><i className="fas fa-tasks"></i> Tasks</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><i className="fas fa-plus"></i> New Task</button>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.375rem' }}>{success}</div>}

      {/* Filter Controls */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              name="search"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={handleFilterChange}
              style={{ flex: 1, maxWidth: '200px' }}
            />
            <select className="form-input" name="status" value={filters.status} onChange={handleFilterChange} style={{ width: '150px' }}>
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="form-input" name="priority" value={filters.priority} onChange={handleFilterChange} style={{ width: '150px' }}>
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select className="form-input" name="department_id" value={filters.department_id} onChange={handleFilterChange} style={{ width: '150px' }}>
              <option value="">All Depts</option>
              {departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
            <select className="form-input" name="assigned_to" value={filters.assigned_to} onChange={handleFilterChange} style={{ width: '150px' }}>
              <option value="">All Emps</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={applyFilters}><i className="fas fa-search"></i> Search</button>
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={clearFilters}><i className="fas fa-times"></i> Clear</button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: '#667eea', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{taskStatistics.todo_tasks}</h3>
          <p>To Do</p>
        </div>
        <div className="card" style={{ background: '#43e97b', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{taskStatistics.in_progress_tasks}</h3>
          <p>In Progress</p>
        </div>
        <div className="card" style={{ background: '#fa709a', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{taskStatistics.completed_tasks}</h3>
          <p>Completed</p>
        </div>
        <div className="card" style={{ background: '#4facfe', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{taskStatistics.total_tasks}</h3>
          <p>Total Tasks</p>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.task_id}>
                  <td>
                    <strong>{task.title}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {task.description?.substring(0, 50)}{task.description?.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td>
                    {task.assigned_employees?.length > 0 ? (
                      <div key={`assigned-${task.task_id}`}>
                        {task.assigned_employees.slice(0, 2).map((emp, index) => (
                          <div key={emp.employee_id} style={{ marginBottom: '0.25rem' }}>
                            <div>
                              <strong>{emp.first_name} {emp.last_name}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                              {task.assigned_employee_departments && task.assigned_employee_departments[index]
                                ? `(${task.assigned_employee_departments[index]})`
                                : '(No Department)'}
                            </div>
                          </div>
                        ))}
                        {task.assigned_employees.length > 2 && (
                          <div key="more-employees" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            +{task.assigned_employees.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : task.status === 'todo' ? 'secondary' : 'info'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {task.due_date ? formatDate(task.due_date, getSetting('date_format')) : 'No due date'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${task.progress || 0}%`,
                            backgroundColor: task.progress > 75 ? '#43e97b' : task.progress > 50 ? '#4facfe' : '#fa709a',
                            borderRadius: '4px'
                          }}
                        ></div>
                      </div>
                      <span>{task.progress || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Only show edit/delete buttons for admins/managers or if the user created the task */}
                      {(user?.role === 'admin' || user?.role === 'manager' || task.created_by === user?.userId) && (
                        <>
                          <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => handleEdit(task)}>Edit</button>
                          <button className="btn btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleDelete(task.task_id)}>Delete</button>
                        </>
                      )}
                      <button className="btn btn-info" style={{ fontSize: '0.75rem' }} onClick={() => handleViewUpdates(task)}>Updates</button>
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
            {' '}({pagination.totalItems} total tasks)
          </span>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
            {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="general">General</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="offboarding">Offboarding</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Hours</label>
                  <input type="number" className="form-input" value={formData.estimated_hours} onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
                    <option value="">All Departments</option>
                    {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Employees</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}>
                  {filteredEmployees.map(emp => (
                    <div key={emp.employee_id} style={{ display: 'flex', alignItems: 'center', padding: '0.25rem 0' }}>
                      <input
                        type="checkbox"
                        id={`emp-${emp.employee_id}`}
                        checked={formData.assigned_employees.includes(emp.employee_id)}
                        onChange={() => toggleEmployee(emp.employee_id)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <label htmlFor={`emp-${emp.employee_id}`} style={{ cursor: 'pointer' }}>
                        {emp.first_name} {emp.last_name} - {emp.position || 'No position'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">{editingTask ? 'Update' : 'Create'}</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Updates Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={handleCloseUpdateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h2>Task Updates: {selectedTaskForUpdate?.title}</h2>
            {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.375rem' }}>{success}</div>}

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
              {taskUpdates.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No updates yet.</p>
              ) : (
                taskUpdates.map((update, index) => (
                  <div key={update.update_id} style={{
                    padding: '1rem',
                    borderBottom: index < taskUpdates.length - 1 ? '1px solid #e5e7eb' : 'none',
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{update.employee?.first_name} {update.employee?.last_name}</strong>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(update.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p>{update.update_text}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {update.hours_spent && <span>Hours: {update.hours_spent}</span>}
                      {update.progress_percentage && <span>Progress: {update.progress_percentage}%</span>}
                      {update.status && <span>Status: {update.status.replace('_', ' ')}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddUpdate}>
              <div className="form-group">
                <label className="form-label">Update Text *</label>
                <textarea
                  className="form-input"
                  value={updateFormData.update_text}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, update_text: e.target.value })}
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Hours Spent</label>
                  <input
                    type="number"
                    className="form-input"
                    value={updateFormData.hours_spent}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, hours_spent: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={updateFormData.progress_percentage}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, progress_percentage: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={updateFormData.status}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
                  >
                    <option value="">No change</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Add Update</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseUpdateModal}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;