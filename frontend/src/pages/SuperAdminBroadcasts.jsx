import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tenantService } from '../services';
import {
  MegaphoneIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const SuperAdminBroadcasts = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info', // 'info', 'warning', 'critical', 'maintenance'
    target_tier: 'all', // 'all', 'free', 'hatch', 'scale', 'enterprise'
    is_active: true,
    expires_at: '',
    dismissible: true
  });

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await tenantService.getAllBroadcasts();
      if (res.success && res.broadcasts) {
        setBroadcasts(res.broadcasts);
      }
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
      setError(err.response?.data?.message || 'Failed to load system broadcasts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBroadcast(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target_tier: 'all',
      is_active: true,
      expires_at: '',
      dismissible: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (bcast) => {
    setEditingBroadcast(bcast);
    setFormData({
      title: bcast.title,
      message: bcast.message,
      type: bcast.type || 'info',
      target_tier: bcast.target_tier || 'all',
      is_active: bcast.is_active !== false,
      expires_at: bcast.expires_at ? new Date(bcast.expires_at).toISOString().slice(0, 16) : '',
      dismissible: bcast.dismissible !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const payload = {
        ...formData,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      };

      if (editingBroadcast) {
        await tenantService.updateBroadcast(editingBroadcast.id, payload);
        setSuccess('System broadcast updated successfully');
      } else {
        await tenantService.createBroadcast(payload);
        setSuccess('New platform broadcast deployed successfully');
      }
      setShowModal(false);
      loadBroadcasts();
    } catch (err) {
      console.error('Save broadcast error:', err);
      setError(err.response?.data?.message || 'Failed to save broadcast');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete broadcast "${title}"?`)) return;
    try {
      await tenantService.deleteBroadcast(id);
      setSuccess('Broadcast deleted successfully');
      loadBroadcasts();
    } catch (err) {
      console.error('Delete broadcast error:', err);
      setError(err.response?.data?.message || 'Failed to delete broadcast');
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'warning':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Warning</span>;
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Critical</span>;
      case 'maintenance':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Maintenance</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Info</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs font-black tracking-wide">
              SUPER ADMIN CONTROL PLANE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 flex items-center gap-2">
            <MegaphoneIcon className="w-6 h-6 text-primary-600" /> Platform System Broadcasts & Banners
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Broadcast scheduled maintenance notices, release notes, and real-time announcement banners to all tenant dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button onClick={loadBroadcasts} className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5">
            <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-xs text-xs flex items-center gap-1.5 shadow-xs">
            <PlusIcon className="w-3.5 h-3.5" /> Deploy Broadcast
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700">&times;</button>
        </div>
      )}

      {/* Broadcasts List */}
      <div className="card p-0 overflow-hidden border border-neutral-200 rounded-2xl shadow-xs bg-white">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Active & Historical Broadcasts</h2>
            <p className="text-[11px] text-neutral-500">Live banners currently rendered on user workspaces</p>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            {broadcasts.length} {broadcasts.length === 1 ? 'broadcast' : 'broadcasts'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading platform broadcasts...</div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <MegaphoneIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-700">No active system broadcasts</p>
            <p className="text-xs text-neutral-400 mt-0.5">Click "Deploy Broadcast" to notify all tenants</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="p-3 font-bold text-neutral-600">Announcement</th>
                  <th className="p-3 font-bold text-neutral-600">Severity</th>
                  <th className="p-3 font-bold text-neutral-600">Target Plan</th>
                  <th className="p-3 font-bold text-neutral-600">Status</th>
                  <th className="p-3 font-bold text-neutral-600">Schedule</th>
                  <th className="p-3 font-bold text-neutral-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="p-3 max-w-sm">
                      <div className="font-bold text-neutral-900 text-xs">{b.title}</div>
                      <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{b.message}</div>
                    </td>
                    <td className="p-3">{getTypeBadge(b.type)}</td>
                    <td className="p-3">
                      <span className="capitalize font-bold text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                        {b.target_tier}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {b.is_active ? 'Live / Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-500">
                      <div>Created: {new Date(b.created_at).toLocaleDateString()}</div>
                      {b.expires_at && <div className="text-amber-600">Expires: {new Date(b.expires_at).toLocaleDateString()}</div>}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Edit Broadcast"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.title)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Broadcast"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-neutral-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <MegaphoneIcon className="w-4 h-4 text-primary-600" />
                {editingBroadcast ? 'Edit System Broadcast' : 'Deploy New System Broadcast'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-700 text-lg leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Announcement Message *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what is happening, downtime windows, or new release features..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="form-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Severity Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-input text-xs w-full"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="critical">Critical Outage (Red)</option>
                    <option value="maintenance">Maintenance (Purple)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Target Plan Tiers</label>
                  <select
                    value={formData.target_tier}
                    onChange={(e) => setFormData({ ...formData, target_tier: e.target.value })}
                    className="form-input text-xs w-full"
                  >
                    <option value="all">All Plans (Global)</option>
                    <option value="free">Free Tier Only</option>
                    <option value="hatch">Starter Tier Only</option>
                    <option value="scale">Professional Tier Only</option>
                    <option value="enterprise">Enterprise Tier Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Auto-Expiry Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="form-input text-xs w-full"
                  />
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-bold text-neutral-800">Is Active</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dismissible}
                      onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-bold text-neutral-800">Dismissible</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider block mb-1">Live Preview</span>
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  formData.type === 'warning' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                  formData.type === 'critical' ? 'bg-red-50 text-red-900 border-red-200' :
                  formData.type === 'maintenance' ? 'bg-purple-50 text-purple-900 border-purple-200' :
                  'bg-blue-50 text-blue-900 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formData.title || 'Broadcast Title'}:</span>
                    <span>{formData.message || 'Your broadcast message content here'}</span>
                  </div>
                  {formData.dismissible && <span className="text-xs opacity-60">&times;</span>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-xs text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-xs text-xs">
                  {editingBroadcast ? 'Update Broadcast' : 'Deploy Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminBroadcasts;
