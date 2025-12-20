import React, { useEffect, useState } from 'react';
import { taskService, employeeService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { FaTasks, FaPlus, FaSearch, FaTimes, FaFilter, FaCheckCircle, FaSpinner, FaPaperclip, FaClock, FaTrash, FaHistory } from 'react-icons/fa';
import { FiMoreVertical, FiEdit2, FiTrash2, FiAlertCircle } from 'react-icons/fi';

const Tasks = () => {
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();
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
    markAsRead('tasks');
  }, [markAsRead]);

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

    // Reset assigned employees on department change to maintain data integrity
    // (Only if it's a manual change, not initial load for edit)
    if (!editingTask) {
      setFormData(prev => ({ ...prev, assigned_employees: [] }));
    }
  }, [formData.department_id, employees, editingTask]);

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
      // Prepare data for submission, ensuring numeric/optional fields are sent correctly
      const submissionData = {
        ...formData,
        estimated_hours: formData.estimated_hours === '' ? null : formData.estimated_hours,
        actual_hours: formData.actual_hours === '' ? null : formData.actual_hours,
        progress: formData.progress === '' ? 0 : formData.progress,
        department_id: formData.department_id === '' ? null : formData.department_id
      };

      if (editingTask) {
        await taskService.update(editingTask.task_id, submissionData);
        setSuccess('Task updated successfully!');
      } else {
        await taskService.create(submissionData);
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
      actual_hours: task.actual_hours || '',
      progress: task.progress || 0,
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
      actual_hours: '',
      progress: 0,
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
              <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                To Do
                {notifications.tasks > 0 && (
                  <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">New</span>
                )}
              </div>
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
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-grow min-w-[200px]">
              <label className="form-label mb-1">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <input
                  type="text"
                  name="search"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="form-label mb-1">Status</label>
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
            </div>

            <div className="min-w-[140px]">
              <label className="form-label mb-1">Priority</label>
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
            </div>

            <div className="min-w-[180px]">
              <label className="form-label mb-1">Department</label>
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

            <div className="flex gap-2 ml-auto">
              <button className="btn btn-secondary h-[34px]" onClick={clearFilters}>
                <FaTrash className="mr-1" size={10} /> Clear
              </button>
              <button className="btn btn-primary h-[34px]" onClick={applyFilters}>
                <FaFilter className="mr-1" size={10} /> Filter
              </button>
            </div>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
              <h2 className="text-lg font-bold text-neutral-800">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            {/* Form - Body + Footer */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
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
                      <label className="form-label">Estimated Hours</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="0.0"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="form-label">Actual Hours</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="0.0"
                        value={formData.actual_hours}
                        onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
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

                    <div>
                      <label className="form-label">Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-input"
                        placeholder="0"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="form-label">Department <span className="text-red-500">*</span></label>
                      <select
                        className="form-select"
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.department_id} value={dept.department_id}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-neutral-400 mt-1">Filtering employees based on selected department.</p>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Assign Employees</label>
                    <div className="border border-neutral-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-neutral-50/50 custom-scrollbar">
                      {!formData.department_id ? (
                        <div className="text-center py-4 text-neutral-400 italic text-xs">
                          Please select a department first to see employees.
                        </div>
                      ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-4 text-neutral-400 italic text-xs">
                          No employees found in this department.
                        </div>
                      ) : (
                        filteredEmployees.map(emp => (
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
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Sticky */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-neutral-800">Task Timeline</h2>
                <p className="text-xs text-neutral-500 font-medium truncate max-w-md">{selectedTaskForUpdate?.title}</p>
              </div>
              <button onClick={handleCloseUpdateModal} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            {/* Content - Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
                {/* Timeline Column */}
                <div className="lg:col-span-3 space-y-4">
                  <h3 className="text-sm font-bold text-neutral-700 flex items-center gap-2 mb-4">
                    <FaHistory className="text-primary-600" /> Activity History
                  </h3>
                  <div className="bg-neutral-50/50 rounded-xl border border-neutral-200/60 p-5 overflow-hidden">
                    {taskUpdates.length === 0 ? (
                      <div className="text-center py-12 text-neutral-400">
                        <FaClock className="mx-auto mb-3 opacity-20" size={40} />
                        <p className="text-sm font-medium">No activity recorded yet for this task.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {taskUpdates.map((update, index) => (
                          <div key={update.update_id} className="relative pl-7 border-l-2 border-primary-100 last:border-l-transparent pb-1">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary-500 shadow-sm z-10"></div>
                            <div className="flex justify-between items-start mb-2 group">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700 uppercase">
                                  {update.employee?.first_name?.charAt(0)}{update.employee?.last_name?.charAt(0)}
                                </div>
                                <span className="font-bold text-xs text-neutral-900">
                                  {update.employee?.first_name} {update.employee?.last_name}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-medium bg-neutral-100 px-2 py-0.5 rounded-full">
                                {new Date(update.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-neutral-100 shadow-sm mb-3">
                              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{update.update_text}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {update.hours_spent && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                                  <FaClock size={8} /> {update.hours_spent}h Spent
                                </span>
                              )}
                              {update.progress_percentage !== null && (
                                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                                  Progress: {update.progress_percentage}%
                                </span>
                              )}
                              {update.status && (
                                <span className={`badge ${getStatusBadgeClass(update.status)} text-[9px] !px-2 !py-0.5`}>
                                  {update.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Update Column */}
                <div className="lg:col-span-2">
                  <div className="sticky top-0">
                    <h3 className="text-sm font-bold text-neutral-700 flex items-center gap-2 mb-4">
                      <FaPlus className="text-primary-600" /> New Update
                    </h3>

                    {(user.role === 'admin' || user.role === 'manager' || selectedTaskForUpdate?.assigned_employee_ids?.includes(user.userId)) ? (
                      <form onSubmit={handleAddUpdate} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div>
                          <label className="form-label text-xs mb-1.5">Description of work <span className="text-red-500">*</span></label>
                          <textarea
                            className="form-input text-sm min-h-[100px]"
                            value={updateFormData.update_text}
                            onChange={(e) => setUpdateFormData({ ...updateFormData, update_text: e.target.value })}
                            required
                            placeholder="Describe what has been accomplished..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="form-label text-xs mb-1.5">Hours Spent</label>
                            <input
                              type="number"
                              step="0.5"
                              className="form-input text-sm"
                              value={updateFormData.hours_spent}
                              onChange={(e) => setUpdateFormData({ ...updateFormData, hours_spent: e.target.value })}
                              placeholder="0.0"
                            />
                          </div>
                          <div>
                            <label className="form-label text-xs mb-1.5">Progress %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="form-input text-sm"
                              value={updateFormData.progress_percentage}
                              onChange={(e) => setUpdateFormData({ ...updateFormData, progress_percentage: e.target.value })}
                              placeholder="0-100"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label text-xs mb-1.5">Updated Status</label>
                          <select
                            className="form-select text-sm"
                            value={updateFormData.status}
                            onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
                          >
                            <option value="">Maintain Current Status</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>

                        <button type="submit" className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md hover:shadow-lg transition-all mt-2">
                          Post Activity Update
                        </button>
                      </form>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                        <FiAlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Restricted Access</h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Only assigned employees or administrators can post updates for this task.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end shrink-0">
              <button onClick={handleCloseUpdateModal} className="btn btn-secondary px-6">Close Explorer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
