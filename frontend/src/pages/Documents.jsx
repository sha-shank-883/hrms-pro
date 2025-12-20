import React, { useEffect, useState } from 'react';
import { documentService, employeeService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaFileAlt, FaLink, FaExternalLinkAlt, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const Documents = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    employee_id: '',
    department_id: '',
    document_type: ''
  });
  const [formData, setFormData] = useState({
    employee_id: '',
    department_id: '',
    document_type: 'contract',
    title: '',
    description: '',
    file_url: '',
    is_confidential: 'false',
    expiry_date: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadDocuments();
    loadEmployees();
    loadDepartments();
  }, []);

  const loadDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: page,
        limit: 10
      };

      const response = await documentService.getAll(params);
      setDocuments(response.data);
      setPagination(response.pagination);
      setError('');
    } catch (error) {
      setError('Failed to load documents: ' + (error.response?.data?.message || error.message));
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
      loadDocuments(newPage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate that either file_url is provided
    if (!formData.file_url) {
      setError('File URL is required');
      return;
    }

    // For employees, ensure the document is assigned to them and marked as confidential
    let submitData = { ...formData };
    if (user?.role === 'employee') {
      submitData.employee_id = user.employee_id || user.employee_id;
      submitData.is_confidential = 'true';
    }

    try {
      if (editingDoc) {
        const response = await documentService.update(editingDoc.document_id, submitData);
        setSuccess('Document updated successfully!');
      } else {
        const response = await documentService.create(submitData);
        setSuccess('Document uploaded successfully!');
      }
      loadDocuments();
      handleCloseModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.delete(id);
        setSuccess('Document deleted!');
        loadDocuments();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      employee_id: doc.employee_id || '',
      department_id: doc.department_id || '',
      document_type: doc.document_type,
      title: doc.document_name || doc.title,
      description: doc.description || '',
      file_url: doc.file_url,
      is_confidential: doc.is_confidential ? 'true' : 'false',
      expiry_date: doc.expiry_date || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoc(null);
    setError('');
    setFormData({
      employee_id: '',
      department_id: '',
      document_type: 'contract',
      title: '',
      description: '',
      file_url: '',
      is_confidential: 'false',
      expiry_date: ''
    });
  };

  const handleFilter = () => {
    // Reset to first page when filters change
    loadDocuments(1);
  };

  const clearFilters = () => {
    const defaultFilters = {
      employee_id: '',
      department_id: '',
      document_type: ''
    };
    setFilters(defaultFilters);
    // Reload documents with default filters
    loadDocuments(1);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  const documentTypes = ['contract', 'certificate', 'policy', 'id_proof', 'resume', 'offer_letter', 'other'];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Manage employee documents and contracts.</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => {
            if (user?.role === 'employee') {
              // Pre-fill form for employee's own document
              setFormData({
                ...formData,
                employee_id: user.employee_id || user.employee_id || '',
                is_confidential: 'true'
              });
            }
            setShowModal(true);
          }}>
            <FaPlus /> Upload Document
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-lg bg-danger-50 text-danger-700 border border-danger-200 flex items-center gap-3"><FaExclamationCircle /> {error}</div>}
      {success && <div className="mb-6 p-4 rounded-lg bg-success-50 text-success-700 border border-success-200 flex items-center gap-3"><FaCheckCircle /> {success}</div>}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card border-l-4 border-l-primary-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <FaFileAlt size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Docs</p>
              <h3 className="text-xl font-bold text-neutral-900">{documents.length}</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-emerald-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FaFileAlt size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contracts</p>
              <h3 className="text-xl font-bold text-neutral-900">{documents.filter(d => d.document_type === 'contract').length}</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-indigo-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FaFileAlt size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Certificates</p>
              <h3 className="text-xl font-bold text-neutral-900">{documents.filter(d => d.document_type === 'certificate').length}</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-danger-500 shadow-sm">
          <div className="card-body p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center text-danger-600">
              <FaExclamationCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Expired</p>
              <h3 className="text-xl font-bold text-neutral-900">{documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()).length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px] flex-grow">
              <label className="form-label mb-1">Employee</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <select
                  className="form-select pl-9 w-full"
                  value={filters.employee_id}
                  onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
            </div>

            <div className="min-w-[200px] flex-grow">
              <label className="form-label mb-1">Department</label>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <select
                  className="form-select pl-9 w-full"
                  value={filters.department_id}
                  onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
                </select>
              </div>
            </div>

            <div className="min-w-[180px]">
              <label className="form-label mb-1">Doc Type</label>
              <div className="relative">
                <FaFileAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                <select
                  className="form-select pl-9 w-full"
                  value={filters.document_type}
                  onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}
                >
                  <option value="">All Types</option>
                  {documentTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 ml-auto">
              <button className="btn btn-secondary h-[34px]" onClick={clearFilters}>
                <FaTrash className="mr-1" size={10} /> Clear
              </button>
              <button className="btn btn-primary h-[34px]" onClick={handleFilter}>
                <FaSearch className="mr-1" size={10} /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Type</th>
              <th>Confidential</th>
              <th>Expiry Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-neutral-500">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-neutral-50 rounded-full mb-3">
                      <FaFileAlt size={24} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-700">No documents found</h3>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.document_id}>
                  <td>
                    <div className="font-semibold text-neutral-900">{doc.document_name || doc.title}</div>
                    <div className="text-xs text-neutral-500 mt-1 max-w-xs truncate">
                      {doc.description}
                    </div>
                  </td>
                  <td>{doc.employee_name || 'All Employees'}</td>
                  <td>{doc.department_name || 'All Departments'}</td>
                  <td>
                    <span className="badge badge-secondary capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {doc.is_confidential ? (
                      <span className="badge badge-danger">Yes</span>
                    ) : (
                      <span className="badge badge-success">No</span>
                    )}
                  </td>
                  <td>
                    {doc.expiry_date ? (
                      <span className={new Date(doc.expiry_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                        {formatDate(doc.expiry_date, getSetting('date_format'))}
                      </span>
                    ) : (
                      <span className="text-neutral-400">N/A</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="View">
                        <FaExternalLinkAlt size={14} />
                      </a>
                      <button className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" onClick={() => handleEdit(doc)} title="Edit">
                        <FaEdit size={14} />
                      </button>
                      <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(doc.document_id)} title="Delete">
                        <FaTrash size={14} />
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
        <div className="flex justify-center items-center gap-2 mt-8">
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

          <span className="text-sm text-neutral-500 ml-4">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
          </span>
        </div>
      )}

      {/* Upload Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h3 className="text-lg font-bold text-neutral-800">{editingDoc ? 'Edit Document' : 'Upload Document'}</h3>
              <button className="text-neutral-400 hover:text-neutral-600 transition-colors" onClick={handleCloseModal}>&times;</button>
            </div>

            <div className="p-6">
              {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">{error}</div>}
              <form onSubmit={handleSubmit}>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Employee</label>
                      <select className="form-input w-full" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                        <option value="">All Employees</option>
                        {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Department</label>
                      <select className="form-input w-full" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
                        <option value="">All Departments</option>
                        {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Document Type *</label>
                    <select className="form-input w-full" value={formData.document_type} onChange={(e) => setFormData({ ...formData, document_type: e.target.value })} required>
                      {documentTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Expiry Date</label>
                    <input type="date" className="form-input w-full" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Title *</label>
                  <input type="text" className="form-input w-full" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>

                <div className="form-group mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <textarea className="form-input w-full" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
                </div>

                <div className="form-group mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">File URL *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-500 text-sm">
                      <FaLink />
                    </span>
                    <input type="url" className="form-input w-full rounded-l-none" value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} required placeholder="https://example.com/document.pdf" />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">Enter the full URL to the document (e.g., from Google Drive, Dropbox, or S3).</p>
                </div>

                <div className="form-group mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={formData.is_confidential === 'true'}
                      onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked ? 'true' : 'false' })}
                    />
                    <span className="ml-2 text-sm text-neutral-700">Confidential Document</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingDoc ? 'Update' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;