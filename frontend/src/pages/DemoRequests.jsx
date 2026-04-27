import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FaUserPlus, FaBuilding, FaEnvelope, FaPhone, FaCheckCircle, FaEdit, FaTimes, FaTrash, FaDownload, FaExclamationTriangle, FaUpload } from 'react-icons/fa';

const DemoRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  const fileInputRef = useRef(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [tenantUpdates, setTenantUpdates] = useState({
    status: '',
    subscription_plan: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching demo requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async (id) => {
    try {
      setActionLoading(id);
      const res = await api.post(`/leads/provision/${id}`);
      if (res.data.success) {
        alert('Demo account provisioned successfully!');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error provisioning demo:', error);
      alert(error.response?.data?.message || 'Error provisioning account.');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (req) => {
    setSelectedTenant(req);
    setTenantUpdates({
      status: req.tenant_status || 'active', // Assuming we might fetch this later, or default
      subscription_plan: req.subscription_plan || 'free'
    });
    setEditModalOpen(true);
  };

  const handleUpdateTenant = async () => {
    try {
      setActionLoading('update');
      // Update tenant
      await api.put(`/tenants/${selectedTenant.tenant_id}`, tenantUpdates);
      alert('Tenant updated successfully!');
      setEditModalOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating tenant:', error);
      alert('Failed to update tenant.');
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteModal = (req) => {
    setSelectedTenant(req);
    setTwoFactorToken('');
    setDeleteModalOpen(true);
  };

  const handleDownloadBackup = async () => {
    try {
      setActionLoading('backup');
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenant_id');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/leads/${selectedTenant.id}/backup`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `backup_${selectedTenant.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Failed to download backup.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTenant = async () => {
    if (!twoFactorToken || twoFactorToken.length !== 6) {
      alert('Please enter a valid 6-digit 2FA code.');
      return;
    }

    try {
      setActionLoading('delete');
      const res = await api.delete(`/leads/${selectedTenant.id}`, {
        headers: { 'x-2fa-token': twoFactorToken }
      });
      if (res.data.success) {
        alert('Demo account deleted successfully!');
        setDeleteModalOpen(false);
        fetchRequests();
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert(error.response?.data?.message || 'Failed to delete account.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setActionLoading('restore');
      const text = await file.text();
      
      const res = await api.post('/leads/restore', { backup: text });
      if (res.data.success) {
        alert('Tenant successfully restored from backup!');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert(error.response?.data?.message || 'Failed to restore backup. Ensure it is a valid JSON file.');
    } finally {
      setActionLoading(null);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Demo Accounts & Tenants</h1>
          <p className="text-sm text-neutral-500">View demo requests and manage provisioned HRMS tenants.</p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleRestoreBackup} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={actionLoading === 'restore'}
            className="px-4 py-2 bg-neutral-800 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-neutral-900 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaUpload /> {actionLoading === 'restore' ? 'Restoring...' : 'Restore Backup'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Admin Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tenant ID & Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-neutral-500">
                    No demo requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FaBuilding />
                        </div>
                        <span className="font-medium text-neutral-900">{req.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">{req.name}</span>
                        <span className="text-xs text-neutral-500 flex items-center gap-1"><FaEnvelope className="text-[10px]" /> {req.email}</span>
                        {req.phone && <span className="text-xs text-neutral-500 flex items-center gap-1"><FaPhone className="text-[10px]" /> {req.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-neutral-600 font-mono">{req.tenant_id}</span>
                        {req.subscription_plan && (
                          <span className="text-xs font-medium text-primary-600 mt-1 capitalize">Plan: {req.subscription_plan}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold capitalize">
                          Pending Approval
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold capitalize">
                          {req.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleProvision(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                          >
                            {actionLoading === req.id ? 'Provisioning...' : <><FaCheckCircle /> Approve</>}
                          </button>
                          <button 
                            onClick={() => openDeleteModal(req)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Request"
                          >
                            <FaTrash className="text-lg" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(req)}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Manage Tenant"
                          >
                            <FaEdit className="text-lg" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(req)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Tenant"
                          >
                            <FaTrash className="text-lg" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Tenant Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="text-lg font-bold text-neutral-900">Manage Tenant: {selectedTenant?.company_name}</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Subscription Plan</label>
                <select 
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={tenantUpdates.subscription_plan}
                  onChange={e => setTenantUpdates({...tenantUpdates, subscription_plan: e.target.value})}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tenant Status</label>
                <select 
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={tenantUpdates.status}
                  onChange={e => setTenantUpdates({...tenantUpdates, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 flex justify-end gap-3 border-t border-neutral-100">
              <button 
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateTenant}
                disabled={actionLoading === 'update'}
                className="px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-primary-700 hover:shadow disabled:opacity-50 transition-all"
              >
                {actionLoading === 'update' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-red-100 bg-red-50/50">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <FaExclamationTriangle /> Delete Account
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-neutral-700">
                Are you sure you want to permanently delete the demo account for <b>{selectedTenant?.company_name}</b>?
              </p>
              
              {selectedTenant?.status === 'provisioned' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-800 mb-3 font-medium">
                    This will irreversibly drop their database schema. It is highly recommended to download a full backup first.
                  </p>
                  <button 
                    onClick={handleDownloadBackup}
                    disabled={actionLoading === 'backup'}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    <FaDownload /> {actionLoading === 'backup' ? 'Generating...' : 'Download Full Backup'}
                  </button>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-neutral-600 mb-2 text-sm font-medium">To confirm deletion, please enter your Super Admin 2FA code.</p>
                <input
                  type="text"
                  className="w-full border border-neutral-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  placeholder="Enter 6-digit 2FA code"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="p-6 bg-neutral-50 flex justify-end gap-3 border-t border-neutral-100">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteTenant}
                disabled={actionLoading === 'delete' || !twoFactorToken || twoFactorToken.length !== 6}
                className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-red-700 hover:shadow disabled:opacity-50 transition-all"
              >
                {actionLoading === 'delete' ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoRequests;
