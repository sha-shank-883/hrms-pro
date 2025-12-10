import React, { useEffect, useState } from 'react';
import { documentService, employeeService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';

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

  if (loading) return <div className="loading">Loading...</div>;

  const documentTypes = ['contract', 'certificate', 'policy', 'id_proof', 'resume', 'offer_letter', 'other'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Documents</h1>
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
          }}>+ Upload Document</button>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.375rem' }}>{success}</div>}

      {/* Statistics */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: '#667eea', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{documents.length}</h3>
          <p>Total Documents</p>
        </div>
        <div className="card" style={{ background: '#43e97b', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{documents.filter(d => d.document_type === 'contract').length}</h3>
          <p>Contracts</p>
        </div>
        <div className="card" style={{ background: '#fa709a', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{documents.filter(d => d.document_type === 'certificate').length}</h3>
          <p>Certificates</p>
        </div>
        <div className="card" style={{ background: '#4facfe', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()).length}</h3>
          <p>Expired</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Filters</h3>
        <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Employee</label>
            <select className="form-input" value={filters.employee_id} onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}>
              <option value="">All Employees</option>
              {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Department</label>
            <select className="form-input" value={filters.department_id} onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}>
              <option value="">All Departments</option>
              {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Document Type</label>
            <select className="form-input" value={filters.document_type} onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}>
              <option value="">All Types</option>
              {documentTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleFilter}>Apply Filters</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Type</th>
              <th>Confidential</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No documents found.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.document_id}>
                  <td>
                    <strong>{doc.document_name || doc.title}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {doc.description?.substring(0, 50)}{doc.description?.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td>{doc.employee_name || 'All Employees'}</td>
                  <td>{doc.department_name || 'All Departments'}</td>
                  <td>
                    <span className="badge badge-secondary">
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
                      <span className={new Date(doc.expiry_date) < new Date() ? 'text-danger' : ''}>
                        {formatDate(doc.expiry_date, getSetting('date_format'))}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-info" style={{ fontSize: '0.75rem' }}>
                        View
                      </a>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => handleEdit(doc)}>Edit</button>
                      <button className="btn btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleDelete(doc.document_id)}>Delete</button>
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
            {' '}({pagination.totalItems} total documents)
          </span>
        </div>
      )}

      {/* Upload Document Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h2>{editingDoc ? 'Edit Document' : 'Upload Document'}</h2>
            {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Employee</label>
                    <select className="form-input" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                      <option value="">All Employees</option>
                      {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-input" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
                      <option value="">All Departments</option>
                      {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Document Type *</label>
                <select className="form-input" value={formData.document_type} onChange={(e) => setFormData({ ...formData, document_type: e.target.value })} required>
                  {documentTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
              </div>

              <div className="form-group">
                <label className="form-label">File URL *</label>
                <input type="url" className="form-input" value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} required placeholder="https://example.com/document.pdf" />
                <small className="form-text">Enter the full URL to the document</small>
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-input" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.is_confidential === 'true'}
                    onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked ? 'true' : 'false' })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Confidential Document
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">{editingDoc ? 'Update' : 'Upload'}</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;