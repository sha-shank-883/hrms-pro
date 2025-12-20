import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService, departmentService, authService, uploadService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { validatePassword } from '../utils/passwordHelper';
import {
  FaUsers, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaTimes,
  FaLinkedin, FaTwitter, FaGithub, FaBuilding, FaMapMarkerAlt,
  FaEnvelope, FaPhone, FaBriefcase, FaGraduationCap, FaUserTie, FaCamera
} from 'react-icons/fa';

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
  const [selectedStatus, setSelectedStatus] = useState(''); // For status filter
  const [selectedEmploymentType, setSelectedEmploymentType] = useState(''); // For employment type filter
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });
  const [activeTab, setActiveTab] = useState('personal');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    address: '',
    about_me: '',
    department_id: '',
    position: '',
    hire_date: '',
    salary: '',
    employment_type: 'full-time',
    status: 'active',
    reporting_manager_id: '',
    password: '',
    social_links: { linkedin: '', twitter: '', github: '' },
    education: [], // [{ degree, school, year }]
    experience: [], // [{ title, company, duration }]
    profile_image: ''
  });

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  useEffect(() => {
    // When filters change, reset to first page
    loadEmployees(1);
  }, [searchTerm, selectedDepartment, selectedStatus, selectedEmploymentType]);

  const loadEmployees = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: 10,
        search: searchTerm,
        department_id: selectedDepartment,
        status: selectedStatus,
        employment_type: selectedEmploymentType
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');

      const formDataObj = new FormData();
      formDataObj.append('file', file);

      const uploadRes = await uploadService.uploadFile(formDataObj);
      const photoUrl = uploadRes.url || uploadRes.data?.url || uploadRes.path;

      if (!photoUrl) throw new Error('Failed to get upload URL');

      setFormData(prev => ({ ...prev, profile_image: photoUrl }));
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Failed to upload photo: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
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
      // Manual Validation
      const requiredFields = [
        { key: 'first_name', label: 'First Name', tab: 'personal' },
        { key: 'last_name', label: 'Last Name', tab: 'personal' },
        { key: 'email', label: 'Email', tab: 'personal' },
        { key: 'hire_date', label: 'Hire Date', tab: 'professional' }
      ];

      for (const field of requiredFields) {
        if (!formData[field.key]) {
          setError(`${field.label} is required`);
          setActiveTab(field.tab);
          return;
        }
      }

      // Password validation
      if (!editingEmployee && !formData.password) {
        setError('Password is required for new employees');
        setActiveTab('professional');
        return;
      }

      if (formData.password) {
        const { isValid, errors } = validatePassword(formData.password, settings);
        if (!isValid) {
          setError(errors.join(' '));
          setActiveTab('professional');
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
      date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth).toISOString().split('T')[0] : '',
      gender: employee.gender || 'male',
      address: employee.address || '',
      about_me: employee.about_me || '',
      department_id: employee.department_id || '',
      position: employee.position || '',
      hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
      salary: employee.salary || '',
      employment_type: employee.employment_type || 'full-time',
      status: employee.status || 'active',
      reporting_manager_id: employee.reporting_manager_id || '',
      password: '',
      social_links: employee.social_links || { linkedin: '', twitter: '', github: '' },
      experience: Array.isArray(employee.experience) ? employee.experience : [],
      profile_image: employee.profile_image || ''
    });
    setActiveTab('personal');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setError('');
    setActiveTab('personal');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      about_me: '',
      department_id: '',
      position: '',
      hire_date: '',
      salary: '',
      employment_type: 'full-time',
      status: 'active',
      reporting_manager_id: '',
      password: '',
      social_links: { linkedin: '', twitter: '', github: '' },
      education: [],
      experience: [],
      profile_image: ''
    });
  };

  // Helper to manage JSON arrays (education/experience)
  const handleArrayChange = (field, index, subfield, value) => {
    const newArray = [...formData[field]];
    newArray[index] = { ...newArray[index], [subfield]: value };
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field, emptyItem) => {
    setFormData({ ...formData, [field]: [...formData[field], emptyItem] });
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedStatus('');
    setSelectedEmploymentType('');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container max-w-none mx-0 px-0 pb-12">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage employee records, roles, and permissions.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> <span>Add Employee</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger-50 text-danger-700 border border-danger-200 flex items-center gap-3">
          <FaTimes /> {error}
        </div>
      )}

      {/* Enhanced Search and Filter Section - Proper Single Row Flex Layout */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search Field */}
            <div className="flex-grow min-w-[200px]">
              <label className="form-label mb-1">Search Employees</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  className="form-input pl-10 w-full"
                  placeholder="Search by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="min-w-[180px]">
              <label className="form-label mb-1">Department</label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <select
                  className="form-select pl-9 w-full"
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
            </div>

            {/* Status Filter */}
            <div className="min-w-[120px]">
              <label className="form-label mb-1">Status</label>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <select
                  className="form-select pl-9 w-full"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>

            {/* Employment Type Filter */}
            <div className="min-w-[140px]">
              <label className="form-label mb-1">Type</label>
              <select
                className="form-select w-full"
                value={selectedEmploymentType}
                onChange={(e) => setSelectedEmploymentType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="ml-auto">
              <button
                className="btn btn-secondary"
                onClick={clearFilters}
              >
                <FaTimes className="mr-1" /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Employees Table - Match Leave Page Design */}
      <div className="card p-0 overflow-hidden">
        <div className="data-table-wrapper overflow-x-auto">
          <table className="data-table w-full table-fixed">
            <thead>
              <tr>
                <th className="w-16 text-center">Avatar</th>
                <th className="w-1/4">Name</th>
                <th className="w-1/4">Email</th>
                <th key="dept" className="w-32">Department</th>
                <th key="pos" className="w-32">Position</th>
                <th className="w-28">Hire Date</th>
                <th className="w-24 text-center">Status</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-neutral-400">
                      <div className="p-4 bg-neutral-50 rounded-full mb-3">
                        <FaUsers size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-700 mb-1">No employees found</h3>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td className="text-center">
                      <div className="avatar avatar-sm mx-auto flex-shrink-0 w-10 h-10">
                        {employee.profile_image ? (
                          <img src={getProfilePicture(employee.profile_image)} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <>{employee.first_name.charAt(0)}{employee.last_name.charAt(0)}</>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-neutral-800 truncate" title={`${employee.first_name} ${employee.last_name}`}>
                        {employee.first_name} {employee.last_name}
                      </div>
                    </td>
                    <td className="text-neutral-600 truncate" title={employee.email}>{employee.email}</td>
                    <td>
                      {employee.department_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 truncate max-w-full">
                          <FaBuilding size={10} className="text-neutral-400 flex-shrink-0" /> <span className="truncate">{employee.department_name}</span>
                        </span>
                      ) : <span className="text-neutral-400">-</span>}
                    </td>
                    <td className="text-neutral-600 font-medium truncate" title={employee.position || ''}>{employee.position || '-'}</td>
                    <td className="text-neutral-500 whitespace-nowrap text-sm">{employee.hire_date ? formatDate(employee.hire_date, getSetting('date_format')) : '-'}</td>
                    <td className="text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${employee.status === 'active' ? 'bg-green-500' : employee.status === 'inactive' ? 'bg-amber-500' : 'bg-red-500'}`} title={employee.status}></span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          onClick={() => navigate(`/employees/${employee.employee_id}`)}
                          title="View Profile"
                        >
                          <FaUserTie size={14} />
                        </button>
                        <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all" onClick={() => handleEdit(employee)} title="Edit">
                          <FaEdit size={16} />
                        </button>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(employee.employee_id)} title="Delete">
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
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
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
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pageNum === pagination.currentPage ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'}`}
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
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
        </div>
      )}

      {/* Employee Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-lg h-[90vh] flex flex-col p-0" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button onClick={handleCloseModal} className="modal-close">
                <FaTimes />
              </button>
            </div>

            {error && <div className="mx-6 mt-4 badge badge-danger rounded-lg text-sm">{error}</div>}

            {/* Modal Tabs */}
            <div className="px-6 border-b border-neutral-100 flex space-x-6 overflow-x-auto flex-shrink-0 bg-white">
              {['personal', 'professional', 'history', 'social'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                    }`}
                >
                  {tab} details
                </button>
              ))}
            </div>

            {/* Modal Content - Scrollable */}
            <div className="modal-body overflow-y-auto flex-grow p-8">
              <form onSubmit={handleSubmit} id="employeeForm">
                {/* PERSONAL TAB */}
                <div className={activeTab === 'personal' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'hidden'}>
                  <div className="md:col-span-2 flex justify-center mb-4">
                    <div className="relative w-24 h-24">
                      <div className="w-24 h-24 rounded-full border-2 border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden">
                        {uploadingPhoto ? (
                          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : formData.profile_image ? (
                          <img src={getProfilePicture(formData.profile_image)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-neutral-300">
                            {formData.first_name?.charAt(0) || '?'}{formData.last_name?.charAt(0) || ''}
                          </span>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-primary-700 transition-all cursor-pointer z-10">
                        <FaCamera size={12} />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">First Name <span className="text-red-500">*</span></label>
                    <input type="text" className="form-input" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" className="form-input" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span className="text-red-500">*</span></label>
                    <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                      <input type="text" className="form-input pl-8" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
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
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Address</label>
                    <textarea className="form-input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows="2" />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="form-label">About Me (Bio)</label>
                    <textarea className="form-input" value={formData.about_me} onChange={(e) => setFormData({ ...formData, about_me: e.target.value })} rows="3" placeholder="Short professional bio..." />
                  </div>
                </div>

                {/* PROFESSIONAL TAB */}
                <div className={activeTab === 'professional' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'hidden'}>
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
                    <label className="form-label">Reporting Manager</label>
                    <select className="form-input" value={formData.reporting_manager_id} onChange={(e) => setFormData({ ...formData, reporting_manager_id: e.target.value })}>
                      <option value="">None (Top Level)</option>
                      {employees.filter(emp => emp.employee_id !== editingEmployee?.employee_id).map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name} - {emp.position}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hire Date <span className="text-red-500">*</span></label>
                    <input type="date" className="form-input" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} />
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
                    <label className="form-label">Password {editingEmployee ? '(optional)' : <span className="text-red-500">*</span>}</label>
                    <input type="password" className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                </div>

                {/* HISTORY TAB */}
                <div className={activeTab === 'history' ? 'block space-y-8' : 'hidden'}>
                  {/* EDUCATION */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                        <FaGraduationCap /> Education
                      </h3>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('education', { degree: '', school: '', year: '' })}>
                        + Add Education
                      </button>
                    </div>

                    {formData.education.length === 0 ? (
                      <div className="p-6 bg-neutral-50 rounded-lg text-center text-sm text-neutral-400 border border-dashed border-neutral-200">No education history added</div>
                    ) : (
                      <div className="space-y-3">
                        {formData.education.map((edu, index) => (
                          <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 relative group">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input type="text" placeholder="Degree" className="form-input" value={edu.degree} onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)} />
                              <input type="text" placeholder="School/University" className="form-input" value={edu.school} onChange={(e) => handleArrayChange('education', index, 'school', e.target.value)} />
                              <input type="text" placeholder="Year" className="form-input" value={edu.year} onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)} />
                            </div>
                            <button type="button" onClick={() => removeArrayItem('education', index)} className="absolute -top-2 -right-2 bg-white text-danger font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-50">
                              <FaTimes size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* EXPERIENCE */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                        <FaBriefcase /> Experience
                      </h3>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('experience', { title: '', company: '', duration: '' })}>
                        + Add Experience
                      </button>
                    </div>

                    {formData.experience.length === 0 ? (
                      <div className="p-6 bg-neutral-50 rounded-lg text-center text-sm text-neutral-400 border border-dashed border-neutral-200">No previous experience added</div>
                    ) : (
                      <div className="space-y-3">
                        {formData.experience.map((exp, index) => (
                          <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 relative group">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input type="text" placeholder="Job Title" className="form-input" value={exp.title} onChange={(e) => handleArrayChange('experience', index, 'title', e.target.value)} />
                              <input type="text" placeholder="Company" className="form-input" value={exp.company} onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)} />
                              <input type="text" placeholder="Duration" className="form-input" value={exp.duration} onChange={(e) => handleArrayChange('experience', index, 'duration', e.target.value)} />
                            </div>
                            <button type="button" onClick={() => removeArrayItem('experience', index)} className="absolute -top-2 -right-2 bg-white text-danger font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-50">
                              <FaTimes size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SOCIAL TAB */}
                <div className={activeTab === 'social' ? 'space-y-4 max-w-lg mx-auto py-4' : 'hidden'}>
                  <div className="form-group">
                    <label className="form-label">LinkedIn URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLinkedin className="text-[#0077b5]" size={18} />
                      </div>
                      <input type="text" className="form-input pl-10" value={formData.social_links.linkedin || ''} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })} placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Twitter / X URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaTwitter className="text-[#1da1f2]" size={18} />
                      </div>
                      <input type="text" className="form-input pl-10" value={formData.social_links.twitter || ''} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })} placeholder="https://twitter.com/..." />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">GitHub URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaGithub className="text-neutral-800" size={18} />
                      </div>
                      <input type="text" className="form-input pl-10" value={formData.social_links.github || ''} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, github: e.target.value } })} placeholder="https://github.com/..." />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button type="submit" form="employeeForm" className="btn btn-primary">
                {editingEmployee ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;