import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    BuildingOffice2Icon,
    PlusIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const SuperAdmin = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        tenantId: '',
        name: '',
        adminEmail: '',
        adminPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const data = await tenantService.getAll();
            setTenants(data);
        } catch (err) {
            console.error('Error fetching tenants:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!/^[a-z0-9_]+$/.test(formData.tenantId)) {
            setError('Tenant ID must contain only lowercase letters, numbers, and underscores.');
            return;
        }

        try {
            await tenantService.create(formData);
            setSuccess('Tenant created successfully!');
            setShowModal(false);
            setFormData({ tenantId: '', name: '', adminEmail: '', adminPassword: '' });
            fetchTenants();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create tenant');
        }
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.tenant_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [manageModal, setManageModal] = useState({ show: false, tenant: null, tab: 'overview' });
    const [manageFormData, setManageFormData] = useState({ status: '', subscription_plan: 'free', subscription_expiry: '' });
    const [resetPasswordData, setResetPasswordData] = useState('');

    const [twoFactorToken, setTwoFactorToken] = useState('');

    const openManageModal = (tenant) => {
        setManageModal({ show: true, tenant, tab: 'overview' });
        setManageFormData({
            status: tenant.status,
            subscription_plan: tenant.subscription_plan || 'free',
            subscription_expiry: tenant.subscription_expiry ? tenant.subscription_expiry.split('T')[0] : '',
            adminEmail: '' // Reset email field
        });
        setResetPasswordData('');
        setTwoFactorToken('');
        setError('');
        setSuccess('');
    };

    const handleManageSubmit = async (e) => {
        e.preventDefault();
        try {
            await tenantService.update(manageModal.tenant.tenant_id, manageFormData);
            setSuccess('Tenant updated successfully');
            fetchTenants();
            // Update local state
            setManageModal(prev => ({ ...prev, tenant: { ...prev.tenant, ...manageFormData } }));
            // Clear email field after update
            setManageFormData(prev => ({ ...prev, adminEmail: '' }));
        } catch (err) {
            setError('Failed to update tenant');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await tenantService.resetAdminPassword(manageModal.tenant.tenant_id, resetPasswordData);
            setSuccess('Admin password reset successfully');
            setResetPasswordData('');
        } catch (err) {
            setError('Failed to reset password');
        }
    };

    const handleDeleteTenant = async () => {
        if (!window.confirm(`Are you absolutely sure you want to delete tenant "${manageModal.tenant.name}"? This cannot be undone.`)) {
            return;
        }

        try {
            await tenantService.delete(manageModal.tenant.tenant_id, twoFactorToken);
            setSuccess('Tenant deleted successfully');
            setManageModal({ show: false, tenant: null, tab: 'overview' });
            fetchTenants();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete tenant');
        }
    };

    return (
        <div className="w-full pb-8">
            <div className="page-header">
                <div>
                    <h1 className="page-title">SaaS Super Admin</h1>
                    <p className="mt-1 text-neutral-600">Manage tenants and subscriptions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Tenant
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Total Tenants</p>
                            <p className="text-2xl font-bold text-neutral-900 mt-1">{tenants.length}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <BuildingOffice2Icon className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Active Tenants</p>
                            <p className="text-2xl font-bold text-neutral-900 mt-1">
                                {tenants.filter(t => t.status === 'active').length}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Inactive Tenants</p>
                            <p className="text-2xl font-bold text-neutral-900 mt-1">
                                {tenants.filter(t => t.status !== 'active').length}
                            </p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                            <XCircleIcon className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tenants List */}
            <div className="card p-0">
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-neutral-800">All Tenants</h2>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            className="form-input pl-10 py-2 text-sm w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Tenant ID</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-neutral-500">Loading tenants...</td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-neutral-500">
                                        <div className="flex flex-col items-center">
                                            <BuildingOffice2Icon className="w-12 h-12 text-neutral-300 mb-2" />
                                            <p>No tenants found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.tenant_id}>
                                        <td className="font-medium text-neutral-900">{tenant.name}</td>
                                        <td className="font-mono text-sm text-neutral-500">{tenant.tenant_id}</td>
                                        <td>
                                            <span className={`badge badge-${tenant.status === 'active' ? 'success' : 'secondary'}`}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="text-neutral-500">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                className="btn btn-secondary text-xs px-3 py-1.5"
                                                onClick={() => openManageModal(tenant)}
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Tenant Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h3 className="text-lg font-bold text-neutral-800">Create New Tenant</h3>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm flex items-center">
                                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                                    {error}
                                </div>
                            )}

                            <div className="form-group mb-4">
                                <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="form-input w-full"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Tenant ID (Slug)</label>
                                <input
                                    type="text"
                                    name="tenantId"
                                    required
                                    pattern="[a-z0-9_]+"
                                    title="Lowercase letters, numbers, and underscores only"
                                    className="form-input w-full"
                                    value={formData.tenantId}
                                    onChange={handleInputChange}
                                    placeholder="e.g. acme_corp"
                                />
                                <p className="text-xs text-neutral-500 mt-1">Used for database schema. Lowercase, numbers, _ only.</p>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Admin Email</label>
                                <input
                                    type="email"
                                    name="adminEmail"
                                    required
                                    className="form-input w-full"
                                    value={formData.adminEmail}
                                    onChange={handleInputChange}
                                    placeholder="admin@acme.com"
                                />
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    name="adminPassword"
                                    required
                                    className="form-input w-full"
                                    value={formData.adminPassword}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Create Tenant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Tenant Modal */}
            {manageModal.show && manageModal.tenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setManageModal({ ...manageModal, show: false })}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-neutral-800">Manage Tenant</h3>
                                <p className="text-sm text-neutral-500">{manageModal.tenant.name} <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded ml-1">{manageModal.tenant.tenant_id}</span></p>
                            </div>
                            <button onClick={() => setManageModal({ ...manageModal, show: false })} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-neutral-200 px-6">
                            <button
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${manageModal.tab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'overview' })}
                            >
                                Overview
                            </button>
                            <button
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${manageModal.tab === 'security' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'security' })}
                            >
                                Security
                            </button>
                            <button
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${manageModal.tab === 'danger' ? 'border-red-600 text-red-600' : 'border-transparent text-neutral-500 hover:text-red-500 hover:border-red-300'}`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'danger' })}
                            >
                                Danger Zone
                            </button>
                        </div>

                        <div className="p-6">
                            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-2" />{error}</div>}
                            {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-sm flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2" />{success}</div>}

                            {manageModal.tab === 'overview' && (
                                <form onSubmit={handleManageSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="form-group">
                                            <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Status</label>
                                            <select
                                                className="form-input w-full"
                                                value={manageFormData.status}
                                                onChange={(e) => setManageFormData({ ...manageFormData, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Subscription Plan</label>
                                            <select
                                                className="form-input w-full"
                                                value={manageFormData.subscription_plan}
                                                onChange={(e) => setManageFormData({ ...manageFormData, subscription_plan: e.target.value })}
                                            >
                                                <option value="free">Free Tier</option>
                                                <option value="pro">Pro Plan</option>
                                                <option value="enterprise">Enterprise</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Subscription Expiry</label>
                                        <input
                                            type="date"
                                            className="form-input w-full"
                                            value={manageFormData.subscription_expiry}
                                            onChange={(e) => setManageFormData({ ...manageFormData, subscription_expiry: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Update Admin Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="form-input w-full"
                                            value={manageFormData.adminEmail || ''}
                                            onChange={(e) => setManageFormData({ ...manageFormData, adminEmail: e.target.value })}
                                            placeholder="Enter new admin email"
                                        />
                                        <p className="text-xs text-neutral-500 mt-1">This will change the login email for the tenant's admin.</p>
                                    </div>

                                    <div className="flex justify-end pt-4 mt-2 border-t border-neutral-100">
                                        <button type="submit" className="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            )}

                            {manageModal.tab === 'security' && (
                                <form onSubmit={handleResetPassword}>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                        <p className="text-yellow-800 text-sm flex items-start">
                                            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                            <span><strong>Warning:</strong> This will reset the password for all administrators of this tenant.</span>
                                        </p>
                                    </div>

                                    <div className="form-group mb-6">
                                        <label className="form-label block text-sm font-medium text-neutral-700 mb-1">New Admin Password</label>
                                        <input
                                            type="password"
                                            className="form-input w-full"
                                            value={resetPasswordData}
                                            onChange={(e) => setResetPasswordData(e.target.value)}
                                            placeholder="Enter new password"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-neutral-100">
                                        <button type="submit" className="btn btn-danger">Reset Password</button>
                                    </div>
                                </form>
                            )}

                            {manageModal.tab === 'danger' && (
                                <div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                        <p className="text-red-800 text-sm flex items-start">
                                            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                            <span><strong>CRITICAL WARNING:</strong> Deleting a tenant is irreversible. All data, users, and history will be permanently wiped.</span>
                                        </p>
                                    </div>

                                    <p className="text-neutral-600 mb-4 text-sm">To confirm deletion, please enter your Super Admin 2FA code.</p>

                                    <div className="form-group mb-6">
                                        <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Super Admin 2FA Code</label>
                                        <input
                                            type="text"
                                            className="form-input w-full"
                                            value={twoFactorToken}
                                            onChange={(e) => setTwoFactorToken(e.target.value)}
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-neutral-100">
                                        <button
                                            onClick={handleDeleteTenant}
                                            className="btn btn-danger"
                                            disabled={!twoFactorToken || twoFactorToken.length !== 6}
                                        >
                                            Permanently Delete Tenant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdmin;
