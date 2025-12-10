import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    BuildingOffice2Icon,
    PlusIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon
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
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">SaaS Super Admin</h1>
                    <p className="page-description">Manage tenants and subscriptions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                >
                    <PlusIcon className="w-5 h-5" style={{ width: '1.25rem', height: '1.25rem' }} />
                    Create Tenant
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Tenants</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>{tenants.length}</p>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'var(--info-bg)', borderRadius: '0.5rem' }}>
                            <BuildingOffice2Icon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--info-text)' }} />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Tenants</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                {tenants.filter(t => t.status === 'active').length}
                            </p>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'var(--success-bg)', borderRadius: '0.5rem' }}>
                            <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--success-text)' }} />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Inactive Tenants</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                {tenants.filter(t => t.status !== 'active').length}
                            </p>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', borderRadius: '0.5rem' }}>
                            <XCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--danger-text)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tenants List */}
            <div className="card">
                <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>All Tenants</h2>
                    <div style={{ position: 'relative' }}>
                        <MagnifyingGlassIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-tertiary)', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Tenant ID</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading tenants...</td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No tenants found</td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.tenant_id}>
                                        <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{tenant.name}</td>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{tenant.tenant_id}</td>
                                        <td>
                                            <span className={`badge badge-${tenant.status === 'active' ? 'success' : 'secondary'}`}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Create New Tenant</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                <XCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="alert alert-error">
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tenant ID (Slug)</label>
                                <input
                                    type="text"
                                    name="tenantId"
                                    required
                                    pattern="[a-z0-9_]+"
                                    title="Lowercase letters, numbers, and underscores only"
                                    className="form-input"
                                    value={formData.tenantId}
                                    onChange={handleInputChange}
                                    placeholder="e.g. acme_corp"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Used for database schema. Lowercase, numbers, _ only.</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Admin Email</label>
                                <input
                                    type="email"
                                    name="adminEmail"
                                    required
                                    className="form-input"
                                    value={formData.adminEmail}
                                    onChange={handleInputChange}
                                    placeholder="admin@acme.com"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Admin Password</label>
                                <input
                                    type="password"
                                    name="adminPassword"
                                    required
                                    className="form-input"
                                    value={formData.adminPassword}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                    style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
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
                <div className="modal-overlay" onClick={() => setManageModal({ ...manageModal, show: false })}>
                    <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Manage Tenant</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{manageModal.tenant.name} ({manageModal.tenant.tenant_id})</p>
                            </div>
                            <button onClick={() => setManageModal({ ...manageModal, show: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                <XCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                            <button
                                className={`btn ${manageModal.tab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none', marginRight: '0.5rem' }}
                                onClick={() => setManageModal({ ...manageModal, tab: 'overview' })}
                            >
                                Overview
                            </button>
                            <button
                                className={`btn ${manageModal.tab === 'security' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none', marginRight: '0.5rem' }}
                                onClick={() => setManageModal({ ...manageModal, tab: 'security' })}
                            >
                                Security
                            </button>
                            <button
                                className={`btn ${manageModal.tab === 'danger' ? 'btn-danger' : 'btn-outline'}`}
                                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none', color: manageModal.tab === 'danger' ? 'white' : 'var(--danger-text)', borderColor: manageModal.tab === 'danger' ? 'var(--danger-bg)' : 'var(--border-color)' }}
                                onClick={() => setManageModal({ ...manageModal, tab: 'danger' })}
                            >
                                Danger Zone
                            </button>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        {manageModal.tab === 'overview' && (
                            <form onSubmit={handleManageSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-input"
                                        value={manageFormData.status}
                                        onChange={(e) => setManageFormData({ ...manageFormData, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subscription Plan</label>
                                    <select
                                        className="form-input"
                                        value={manageFormData.subscription_plan}
                                        onChange={(e) => setManageFormData({ ...manageFormData, subscription_plan: e.target.value })}
                                    >
                                        <option value="free">Free Tier</option>
                                        <option value="pro">Pro Plan</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subscription Expiry</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={manageFormData.subscription_expiry}
                                        onChange={(e) => setManageFormData({ ...manageFormData, subscription_expiry: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Update Admin Email (Optional)</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={manageFormData.adminEmail || ''}
                                        onChange={(e) => setManageFormData({ ...manageFormData, adminEmail: e.target.value })}
                                        placeholder="Enter new admin email"
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>This will change the login email for the tenant's admin.</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        )}

                        {manageModal.tab === 'security' && (
                            <form onSubmit={handleResetPassword}>
                                <div className="alert alert-warning">
                                    <p><strong>Warning:</strong> This will reset the password for all administrators of this tenant.</p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Admin Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={resetPasswordData}
                                        onChange={(e) => setResetPasswordData(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                    <button type="submit" className="btn btn-danger">Reset Password</button>
                                </div>
                            </form>
                        )}

                        {manageModal.tab === 'danger' && (
                            <div>
                                <div className="alert alert-error">
                                    <p><strong>CRITICAL WARNING:</strong> Deleting a tenant is irreversible. All data, users, and history will be permanently wiped.</p>
                                </div>
                                <p style={{ marginBottom: '1rem' }}>To confirm deletion, please enter your Super Admin 2FA code.</p>

                                <div className="form-group">
                                    <label className="form-label">Super Admin 2FA Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={twoFactorToken}
                                        onChange={(e) => setTwoFactorToken(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
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
            )}
        </div>
    );
};

export default SuperAdmin;
