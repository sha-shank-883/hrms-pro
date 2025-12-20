import React, { useEffect, useState } from 'react';
import { taskService, employeeService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { FaTasks, FaPlus, FaSearch, FaTimes, FaFilter, FaCheckCircle, FaSpinner, FaPaperclip, FaClock } from 'react-icons/fa';
import { FiMoreVertical, FiEdit2, FiTrash2, FiAlertCircle } from 'react-icons/fi';

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

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'low': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'high': return 'badge-danger';
      case 'urgent': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'todo': return 'badge-secondary';
      case 'in_progress': return 'badge-warning';
      case 'completed': return 'badge-success';
      case 'cancelled': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="page-container pb-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage, track, and collaborate on team tasks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus className="mr-2" /> New Task
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FaTasks className="text-blue-600" />
            </div>
            <div>
              <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Total Tasks</div>
              <div className="text-2xl font-bold text-neutral-800">{taskStatistics.total_tasks}</div>
            </div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <FaClock className="text-amber-600" />
            </div>
            <div>
              <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">To Do</div>
              <div className="text-2xl font-bold text-neutral-800">{taskStatistics.todo_tasks}</div>
            </div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <FaSpinner className="text-indigo-600" />
            </div>
            <div>
              <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">In Progress</div>
              <div className="text-2xl font-bold text-neutral-800">{taskStatistics.in_progress_tasks}</div>
            </div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <FaCheckCircle className="text-green-600" />
            </div>
            <div>
              <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Completed</div>
              <div className="text-2xl font-bold text-neutral-800">{taskStatistics.completed_tasks}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="grid grid-cols-4 gap-3 w-full flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                name="search"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={handleFilterChange}
                className="form-input pl-10"
              />
            </div>

            <select
              className="form-select"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className="form-select"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              className="form-select"
              name="department_id"
              value={filters.department_id}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={applyFilters}>
              <FaFilter className="mr-2" /> Filter
            </button>
            <button className="btn btn-secondary" onClick={clearFilters}>
              <FaTimes className="mr-2" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Task Table */}
      <div className="card p-0">
        <table className="data-table data-table-striped">
          <thead>
            <tr>
              <th className="w-1/4">Title</th>
              <th className="w-1/6">Assigned To</th>
              <th className="w-1/12">Priority</th>
              <th className="w-1/12">Status</th>
              <th className="w-1/12">Due Date</th>
              <th className="w-1/6">Progress</th>
              <th className="w-1/12 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="7" className="data-table-empty">
                  <div className="flex flex-col items-center">
                    <FaTasks size={32} className="text-neutral-300 mb-2" />
                    <p>No tasks found. Try adjusting filters or create a new task.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.task_id} className="group hover:bg-neutral-50">
                  <td className="align-top">
                    <div className="font-semibold text-neutral-900">{task.title}</div>
                    <div className="text-xs text-neutral-500 mt-1 line-clamp-2 max-w-xs" title={task.description}>
                      {task.description}
                    </div>
                  </td>
                  <td className="align-top">
                    {task.assigned_employees?.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden py-1">
                        {task.assigned_employees.slice(0, 3).map((emp, i) => (
                          <div
                            key={emp.employee_id}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase"
                            title={`${emp.first_name} ${emp.last_name}`}
                          >
                            {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                          </div>
                        ))}
                        {task.assigned_employees.length > 3 && (
                          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-500">
                            +{task.assigned_employees.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-sm italic">Unassigned</span>
                    )}
                  </td>
                  <td className="align-middle">
                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="align-middle">
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="align-middle text-neutral-700">
                    {task.due_date ? formatDate(task.due_date, getSetting('date_format')) : <span className="text-neutral-400">-</span>}
                  </td>
                  <td className="align-middle min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${task.progress > 75 ? 'bg-success' : task.progress > 40 ? 'bg-info' : 'bg-warning'
                            }`}
                          style={{ width: `${task.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-neutral-600 w-8">{task.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="align-middle text-right">
                    <div className="flex justify-end gap-1">
                      {(user?.role === 'admin' || user?.role === 'manager' || task.created_by === user?.userId) && (
                        <>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleEdit(task)}
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDelete(task.task_id)}
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => handleViewUpdates(task)}
                        title="View Updates"
                      >
                        <FaClock size={16} />
                      </button>
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
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            Previous
          </button>

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
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${pageNum === pagination.currentPage
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
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

          <span className="text-xs text-neutral-500 ml-4">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} tasks)
          </span>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-lg font-bold text-neutral-800">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="form-label">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="offboarding">Offboarding</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign Employees</label>
                  <div className="border border-neutral-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-neutral-50/50">
                    {filteredEmployees.map(emp => (
                      <label key={emp.employee_id} className="flex items-center gap-3 p-2 hover:bg-white hover:shadow-sm rounded cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={formData.assigned_employees.includes(emp.employee_id)}
                          onChange={() => toggleEmployee(emp.employee_id)}
                          className="form-checkbox"
                        />
                        <div className="text-sm">
                          <span className="font-medium text-neutral-900">{emp.first_name} {emp.last_name}</span>
                          <span className="text-neutral-500 ml-2 text-xs">({emp.position || 'No Title'})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100 mt-6">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTask ? 'Update Task' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Updates Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm" onClick={handleCloseUpdateModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-lg font-bold text-neutral-800">Task Timeline: {selectedTaskForUpdate?.title}</h2>
              <button onClick={handleCloseUpdateModal} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 mb-6 max-h-[300px] overflow-y-auto">
                {taskUpdates.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <FaClock className="mx-auto mb-2 opacity-20" size={32} />
                    <p>No activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {taskUpdates.map((update, index) => (
                      <div key={update.update_id} className="relative pl-6 border-l-2 border-neutral-200 pb-2">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary-500"></div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-neutral-900">
                            {update.employee?.first_name} {update.employee?.last_name}
                          </span>
                          <span className="text-xs text-neutral-400">{new Date(update.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-neutral-700 bg-white p-3 rounded border border-neutral-100 shadow-sm mb-2">{update.update_text}</p>
                        <div className="flex gap-3 text-xs text-neutral-500 font-medium">
                          {update.hours_spent && <span className="flex items-center gap-1"><FaClock size={10} /> {update.hours_spent}h</span>}
                          {update.progress_percentage && <span>Progress: {update.progress_percentage}%</span>}
                          {update.status && <span className={`badge ${getStatusBadgeClass(update.status)} text-[10px]`}>{update.status.replace('_', ' ')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddUpdate} className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-bold text-neutral-700 mb-3 border-b border-neutral-100 pb-2">Add New Update</h4>
                <div className="space-y-3">
                  <textarea
                    className="form-input"
                    value={updateFormData.update_text}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, update_text: e.target.value })}
                    rows="2"
                    required
                    placeholder="What did you work on?"
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="form-label text-xs">Hours</label>
                      <input
                        type="number"
                        className="form-input text-xs"
                        value={updateFormData.hours_spent}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, hours_spent: e.target.value })}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Progress %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-input text-xs"
                        value={updateFormData.progress_percentage}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, progress_percentage: e.target.value })}
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Status</label>
                      <select
                        className="form-select text-xs"
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
                </div>
                <div className="flex justify-end pt-3 mt-2">
                  <button type="submit" className="btn btn-primary text-xs py-1.5">Post Update</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
