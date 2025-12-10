import React, { useEffect, useState } from 'react';
import { documentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';

const MyDocuments = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    document_type: 'other',
    title: '',
    description: '',
    file_url: '',
    expiry_date: ''
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Load all documents without filters for employees
      const response = await documentService.getAll({});
      console.log('Documents loaded:', response.data);
      setDocuments(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError('Failed to load documents: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate that file_url is provided
    if (!formData.file_url) {
      setError('File URL is required');
      return;
    }

    try {
      // For employees, automatically assign document to themselves and mark as confidential
      const submitData = {
        ...formData,
        employee_id: user.employee_id,
        is_confidential: true
      };

      console.log('Submitting document data:', submitData);
      const response = await documentService.create(submitData);
      console.log('Document create response:', response);

      setSuccess('Document uploaded successfully!');
      loadDocuments();
      handleCloseModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Document operation failed:', error);
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setFormData({
      document_type: 'other',
      title: '',
      description: '',
      file_url: '',
      expiry_date: ''
    });
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

  if (loading) return <div className="loading">Loading...</div>;

  const documentTypes = {
    'contract': 'Contract',
    'certificate': 'Certificate',
    'policy': 'Policy',
    'id_proof': 'ID Proof',
    'resume': 'Resume',
    'offer_letter': 'Offer Letter',
    'other': 'Other'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1><i className="fas fa-folder"></i> My Documents</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Upload Document</button>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.375rem' }}>{success}</div>}

      {/* Statistics */}
      <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{documents.length}</h3>
          <p>Total Documents</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{documents.filter(d => d.document_type === 'contract').length}</h3>
          <p>Contracts</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
          <h3 style={{ fontSize: '2rem' }}>{documents.filter(d => d.document_type === 'certificate').length}</h3>
          <p>Certificates</p>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Upload Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><i className="fas fa-file"></i></div>
                  <h3>No Documents Found</h3>
                  <p>You don't have any documents yet. HR will upload documents for you when available.</p>
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                const isExpiringSoon = doc.expiry_date &&
                  new Date(doc.expiry_date) > new Date() &&
                  new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

                return (
                  <tr key={doc.document_id}>
                    <td>
                      <strong>{doc.document_name}</strong>
                      {doc.is_confidential && (
                        <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>🔒 Confidential</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {documentTypes[doc.document_type] || doc.document_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(doc.uploaded_at, getSetting('date_format'))}</td>
                    <td>
                      {doc.expiry_date ? formatDate(doc.expiry_date, getSetting('date_format')) : 'N/A'}
                      {isExpiringSoon && (
                        <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>⚠️ Expiring Soon</span>
                      )}
                    </td>
                    <td>
                      {isExpired ? (
                        <span className="badge badge-danger">Expired</span>
                      ) : isExpiringSoon ? (
                        <span className="badge badge-warning">Expiring Soon</span>
                      ) : (
                        <span className="badge badge-success">Valid</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.75rem', textDecoration: 'none' }}>
                            <i className="fas fa-eye"></i> View
                          </a>
                        )}
                        {doc.is_confidential && (
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleDelete(doc.document_id)}
                            title="Delete (only for your own confidential documents)"
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Information Section */}
      <div className="card" style={{ marginTop: '2rem', background: '#f0f9ff', borderLeft: '4px solid #3b82f6' }}>
        <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>ℹ️ Document Access Information</h3>
        <p>You can view:</p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Your personal documents (uploaded specifically for you)</li>
          <li>Public documents shared by HR/Admin (non-confidential)</li>
        </ul>
        <p><strong>Note:</strong> Confidential documents are marked with 🔒 and can only be accessed by you and authorized personnel.</p>
      </div>

      {/* Upload Document Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Upload Document</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Document Type *</label>
                  <select
                    className="form-input"
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                    required
                  >
                    {Object.entries(documentTypes).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">File URL *</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
                <small style={{ color: '#6b7280' }}>Enter the URL of the uploaded document</small>
                {!formData.file_url && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>File URL is required</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Upload</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
