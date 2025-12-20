import React, { useEffect, useState } from 'react';
import { documentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { FaFolder, FaFileAlt, FaEye, FaTrash, FaTimes, FaCloudUploadAlt, FaInfoCircle, FaCheck, FaExclamationTriangle, FaLock } from 'react-icons/fa';

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

    if (!formData.file_url) {
      setError('File URL is required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        employee_id: user.employee_id,
        is_confidential: true
      };

      await documentService.create(submitData);
      setSuccess('Document uploaded successfully!');
      loadDocuments();
      handleCloseModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FaFolder /></div>
            My Documents
          </h1>
          <p className="text-gray-500 mt-1">Manage and view your personal documents</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <FaCloudUploadAlt /> Upload Document
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2"><FaExclamationTriangle /> {error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-2"><FaCheck /> {success}</div>}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 font-medium mb-1">Total Documents</p>
              <h3 className="text-4xl font-bold">{documents.length}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><FaFileAlt size={24} /></div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 font-medium mb-1">Contracts</p>
              <h3 className="text-4xl font-bold">{documents.filter(d => d.document_type === 'contract').length}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><FaLock size={24} /></div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white border-none">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-pink-100 font-medium mb-1">Certificates</p>
              <h3 className="text-4xl font-bold">{documents.filter(d => d.document_type === 'certificate').length}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><FaFolder size={24} /></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-800">Document List</h3>
        </div>
        <div className="p-0 table-responsive">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Upload Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300 text-3xl"><FaFolder /></div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Documents Found</h3>
                      <p className="text-sm">You don't have any documents yet. Upload one or wait for HR.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                  const isExpiringSoon = doc.expiry_date &&
                    new Date(doc.expiry_date) > new Date() &&
                    new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <tr key={doc.document_id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{doc.document_name}</span>
                          {doc.is_confidential && (
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-wide">Confidential</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {documentTypes[doc.document_type] || doc.document_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-gray-600">{formatDate(doc.uploaded_at, getSetting('date_format'))}</td>
                      <td className="text-gray-600">
                        {doc.expiry_date ? formatDate(doc.expiry_date, getSetting('date_format')) : 'N/A'}
                        {isExpiringSoon && (
                          <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Expiring Soon</span>
                        )}
                      </td>
                      <td>
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Expired</span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Expiring Soon</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Valid</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {doc.file_url && (
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary flex items-center gap-1">
                              <FaEye /> View
                            </a>
                          )}
                          {doc.is_confidential && (
                            <button
                              className="btn btn-sm btn-danger flex items-center gap-1"
                              onClick={() => handleDelete(doc.document_id)}
                              title="Delete"
                            >
                              <FaTrash />
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
      </div>

      {/* Information Section */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
        <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-2"><FaInfoCircle /> Document Access Information</h3>
        <p className="text-blue-800 text-sm mb-3">You can view:</p>
        <ul className="list-disc list-inside text-blue-700 text-sm space-y-1 ml-2">
          <li>Your personal documents (uploaded specifically for you)</li>
          <li>Public documents shared by HR/Admin (non-confidential)</li>
        </ul>
        <p className="text-blue-800 text-sm mt-3 font-medium">Confidential documents are marked and can only be accessed by you and authorized personnel.</p>
      </div>

      {/* Upload Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Upload Document</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors"><FaTimes size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Employment Contract"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Document Type <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        className="form-input appearance-none"
                        value={formData.document_type}
                        onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                        required
                      >
                        {Object.entries(documentTypes).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>
                    </div>
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
                  <label className="form-label">File URL <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <FaExternalLinkAlt size={12} />
                    </span>
                    <input
                      type="url"
                      className="form-input pl-8"
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter the direct link to the document.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Upload</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this icon since I used it but forgot to import sometimes
import { FaExternalLinkAlt } from 'react-icons/fa';

export default MyDocuments;
