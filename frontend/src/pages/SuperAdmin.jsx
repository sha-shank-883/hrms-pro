import React, { useState, useEffect, useRef } from 'react';
import { tenantService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    BuildingOffice2Icon,
    PlusIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    DevicePhoneMobileIcon,
    ArrowRightOnRectangleIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CloudArrowUpIcon,
    AdjustmentsHorizontalIcon,
    CreditCardIcon,
    BanknotesIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const SuperAdmin = () => {
    const { user } = useAuth();
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [systemModules, setSystemModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [formData, setFormData] = useState({
        tenantId: '',
        name: '',
        adminEmail: '',
        adminPassword: '',
        subscription_plan: 'free'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Manage Tenant Modal State
    const [manageModal, setManageModal] = useState({ show: false, tenant: null, tab: 'overview' });
    const [manageFormData, setManageFormData] = useState({ status: '', subscription_plan: 'free', subscription_expiry: '' });
    const [resetPasswordData, setResetPasswordData] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState('');

    // Tenant Module Customization State
    const [tenantModulesData, setTenantModulesData] = useState({
        is_custom: false,
        active_modules: [],
        loading: false
    });

    // Tenant Contact & Billing Profile State (Inside Manage Modal)
    const [tenantBillingProfile, setTenantBillingProfile] = useState({
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        billing_address: '',
        city: '',
        country: 'India',
        tax_id: '',
        billing_currency: 'INR',
        billing_cycle: 'monthly',
        invoices: [],
        loading: false
    });

    // Restore Backup State
    const [restoreModal, setRestoreModal] = useState({ show: false, result: null, loading: false, targetTenant: null });
    const restoreFileInputRef = useRef(null);
    const [restoreTargetTenant, setRestoreTargetTenant] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tenantsData, plansData] = await Promise.all([
                tenantService.getAll(),
                tenantService.getPlanConfigs().catch(() => ({ plans: [], systemModules: [] }))
            ]);
            setTenants(tenantsData || []);
            if (plansData?.plans) setPlans(plansData.plans);
            if (plansData?.systemModules) setSystemModules(plansData.systemModules);
        } catch (err) {
            console.error('Error loading Super Admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const data = await tenantService.getAll();
            setTenants(data || []);
        } catch (err) {
            console.error('Error fetching tenants:', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!/^[a-z0-9_]+$/.test(formData.tenantId)) {
            setError('Tenant ID must contain only lowercase letters, numbers, and underscores.');
            return;
        }

        try {
            await tenantService.create(formData);
            setSuccess('Tenant created successfully!');
            setShowModal(false);
            setFormData({ tenantId: '', name: '', adminEmail: '', adminPassword: '', subscription_plan: 'free' });
            loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create tenant');
        }
    };

    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tenant.tenant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tenant.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const openManageModal = async (tenant, initialTab = 'overview') => {
        setManageModal({ show: true, tenant, tab: initialTab });
        setManageFormData({
            status: tenant.status,
            subscription_plan: tenant.subscription_plan || 'free',
            subscription_expiry: tenant.subscription_expiry ? tenant.subscription_expiry.split('T')[0] : '',
            adminEmail: ''
        });
        setResetPasswordData('');
        setTwoFactorToken('');
        setError('');
        setSuccess('');

        // Fetch tenant module details
        try {
            setTenantModulesData(prev => ({ ...prev, loading: true }));
            const modRes = await tenantService.getTenantModules(tenant.tenant_id);
            setTenantModulesData({
                is_custom: modRes.is_custom || false,
                active_modules: modRes.active_modules || [],
                loading: false
            });
        } catch (err) {
            console.error('Error fetching tenant modules:', err);
            setTenantModulesData({ is_custom: false, active_modules: [], loading: false });
        }

        // Fetch contact & billing profile
        try {
            setTenantBillingProfile(prev => ({ ...prev, loading: true }));
            const billRes = await tenantService.getTenantBillingProfile(tenant.tenant_id);
            if (billRes.success && billRes.tenant) {
                setTenantBillingProfile({
                    contact_person: billRes.tenant.contact_person || '',
                    contact_email: billRes.tenant.contact_email || '',
                    contact_phone: billRes.tenant.contact_phone || '',
                    billing_address: billRes.tenant.billing_address || '',
                    city: billRes.tenant.city || '',
                    country: billRes.tenant.country || 'India',
                    tax_id: billRes.tenant.tax_id || '',
                    billing_currency: billRes.tenant.billing_currency || 'INR',
                    billing_cycle: billRes.tenant.billing_cycle || 'monthly',
                    invoices: billRes.invoices || [],
                    loading: false
                });
            }
        } catch (err) {
            console.error('Error fetching tenant billing profile:', err);
            setTenantBillingProfile(prev => ({ ...prev, loading: false }));
        }
    };

    const handleManageSubmit = async (e) => {
        e.preventDefault();
        try {
            await tenantService.update(manageModal.tenant.tenant_id, manageFormData);
            setSuccess('Tenant updated successfully');
            fetchTenants();
            setManageModal(prev => ({ ...prev, tenant: { ...prev.tenant, ...manageFormData } }));
            setManageFormData(prev => ({ ...prev, adminEmail: '' }));
        } catch (err) {
            setError('Failed to update tenant');
        }
    };

    const handleSaveTenantBillingProfile = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const res = await tenantService.updateTenantBillingProfile(manageModal.tenant.tenant_id, tenantBillingProfile);
            setSuccess(res.message || 'Contact & billing profile saved successfully');
            fetchTenants();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update billing profile');
        }
    };

    const handleToggleTenantModule = (moduleKey) => {
        setTenantModulesData(prev => {
            const current = new Set(prev.active_modules);
            if (current.has(moduleKey)) {
                if (moduleKey === 'core_hr') return prev;
                current.delete(moduleKey);
            } else {
                current.add(moduleKey);
            }
            return {
                ...prev,
                is_custom: true,
                active_modules: Array.from(current)
            };
        });
    };

    const handleSaveTenantModules = async () => {
        try {
            setError('');
            const res = await tenantService.updateTenantModules(manageModal.tenant.tenant_id, {
                customModules: tenantModulesData.active_modules
            });
            setSuccess(res.message || 'Custom modules updated successfully');
            setTenantModulesData(prev => ({
                ...prev,
                is_custom: true,
                active_modules: res.active_modules
            }));
            fetchTenants();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update tenant modules');
        }
    };

    const handleResetTenantModules = async () => {
        if (!window.confirm('Reset this tenant to inherit default modules from its subscription plan?')) {
            return;
        }
        try {
            setError('');
            const res = await tenantService.updateTenantModules(manageModal.tenant.tenant_id, {
                resetToDefault: true
            });
            setSuccess(res.message || 'Reset to default plan modules');
            setTenantModulesData({
                is_custom: false,
                active_modules: res.active_modules,
                loading: false
            });
            fetchTenants();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset tenant modules');
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

    const handleImpersonate = async (tenantId) => {
        try {
            setError('');
            setSuccess('');
            
            const currentToken = localStorage.getItem('token');
            const currentUser = localStorage.getItem('user');
            const currentTenant = localStorage.getItem('tenant_id');

            if (currentToken && currentTenant) {
                sessionStorage.setItem('originalSuperAdminAuth', JSON.stringify({
                    token: currentToken,
                    user: currentUser ? JSON.parse(currentUser) : null,
                    tenantId: currentTenant
                }));
            }

            const res = await tenantService.impersonate(tenantId);
            if (res.success && res.data) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('tenant_id', res.data.tenantId);
                
                window.location.href = '/dashboard';
            }
        } catch (err) {
            console.error('Impersonation error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to impersonate tenant admin');
        }
    };

    const handleRestoreBackup = (tenant) => {
        setRestoreTargetTenant(tenant);
        restoreFileInputRef.current.value = '';
        restoreFileInputRef.current.click();
    };

    const handleRestoreFileSelected = async (e) => {
        const file = e.target.files[0];
        if (!file || !restoreTargetTenant) return;

        const tenant = restoreTargetTenant;

        if (!window.confirm(
            `⚠️ RESTORE TENANT: "${tenant.name}"\n\n` +
            `This will COMPLETELY REPLACE all data for tenant "${tenant.name}" with the backup file.\n\n` +
            `The existing schema will be dropped and recreated.\n\n` +
            `Are you absolutely sure you want to continue?`
        )) return;

        setRestoreModal({ show: true, result: null, loading: true, targetTenant: tenant });

        try {
            const text = await file.text();
            const backupJson = JSON.parse(text);

            const result = await tenantService.restore(tenant.tenant_id, backupJson);
            setRestoreModal({ show: true, result, loading: false, targetTenant: tenant });
            fetchTenants();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.message || 'Restore failed';
            setRestoreModal({
                show: true,
                result: { error: errMsg },
                loading: false,
                targetTenant: tenant
            });
        }
    };

    const handleDownloadBackup = async (tenant) => {
        try {
            const response = await tenantService.backup(tenant.tenant_id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `backup_${tenant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Backup failed:', err);
            alert('Failed to download backup');
        }
    };

    return (
        <div className="w-full pb-8">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="page-title text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
                        Company Tenants Directory
                    </h1>
                    <p className="mt-0.5 text-xs text-neutral-500">
                        Multi-tenant control plane, customer account management, database snapshots, and workspace access
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={loadData} className="btn btn-secondary btn-xs text-xs">
                        <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary btn-xs text-xs"
                    >
                        <PlusIcon className="w-3.5 h-3.5 mr-1" />
                        New Company
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            {success && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between animate-in fade-in text-xs">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">{success}</span>
                    </div>
                    <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700"><XCircleIcon className="w-4 h-4" /></button>
                </div>
            )}
            {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between animate-in fade-in text-xs">
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><XCircleIcon className="w-4 h-4" /></button>
                </div>
            )}

            {/* 4-Column Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Companies</p>
                            <p className="text-2xl font-black text-neutral-900 mt-1">{tenants.length}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Registered workspaces</p>
                        </div>
                        <div className="p-2.5 bg-primary-50 rounded-xl">
                            <BuildingOffice2Icon className="w-5 h-5 text-primary-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Active Tenants</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">
                                {tenants.filter(t => t.status === 'active').length}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Live operating accounts</p>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-xl">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Paid Subscriptions</p>
                            <p className="text-2xl font-black text-amber-600 mt-1">
                                {tenants.filter(t => t.subscription_plan && t.subscription_plan !== 'free').length}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Scale & Enterprise plans</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-xl">
                            <BanknotesIcon className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Configured Tiers</p>
                            <p className="text-2xl font-black text-indigo-600 mt-1">{plans.length}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Active plan definitions</p>
                        </div>
                        <div className="p-2.5 bg-indigo-50 rounded-xl">
                            <CreditCardIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tenants List Table */}
            <div className="card p-0 overflow-hidden border border-neutral-200 shadow-xs rounded-2xl">
                <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-neutral-50/60">
                    <div>
                        <h2 className="text-sm font-bold text-neutral-900">All Company Accounts</h2>
                        <p className="text-[11px] text-neutral-500">Manage contact details, billing, module overrides, backups and impersonation</p>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <select
                            className="form-input py-1 text-xs"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>

                        <div className="relative w-full sm:w-60">
                            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search company or ID..."
                                className="form-input pl-8 py-1 text-xs w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Company & Contact</th>
                                <th>Tenant ID</th>
                                <th>Status</th>
                                <th>Subscription Plan</th>
                                <th>Module Entitlement</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-neutral-500 text-xs">Loading tenants...</td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-neutral-500 text-xs">
                                        <div className="flex flex-col items-center">
                                            <BuildingOffice2Icon className="w-10 h-10 text-neutral-300 mb-1.5" />
                                            <p className="font-medium">No tenants found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => {
                                    const hasCustom = tenant.custom_modules && Array.isArray(tenant.custom_modules) && tenant.custom_modules.length > 0;
                                    const planConfig = plans.find(p => p.plan_id === tenant.subscription_plan) || {};
                                    const modCount = hasCustom ? tenant.custom_modules.length : (planConfig.modules?.length || 5);

                                    return (
                                        <tr key={tenant.tenant_id} className="hover:bg-neutral-50/70 transition-colors">
                                            <td>
                                                <div className="font-bold text-neutral-900 text-xs">{tenant.name}</div>
                                                <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                                                    {tenant.contact_person && (
                                                        <span className="font-medium text-neutral-700">{tenant.contact_person}</span>
                                                    )}
                                                    {tenant.contact_email && (
                                                        <span className="text-neutral-400">• {tenant.contact_email}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-mono text-xs text-neutral-600">
                                                <span className="bg-neutral-100 px-2 py-0.5 rounded text-[11px] font-semibold">{tenant.tenant_id}</span>
                                            </td>
                                            <td>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                                                }`}>
                                                    {tenant.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-col items-start">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-primary-50 text-primary-700 border border-primary-100">
                                                        {tenant.subscription_plan || 'free'}
                                                    </span>
                                                    {tenant.subscription_expiry && (
                                                        <span className="text-[10px] text-neutral-400 mt-0.5">
                                                            Exp: {new Date(tenant.subscription_expiry).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {hasCustom ? (
                                                    <button
                                                        onClick={() => openManageModal(tenant, 'modules')}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-bold transition-colors"
                                                    >
                                                        <AdjustmentsHorizontalIcon className="w-3 h-3 text-amber-600" />
                                                        Custom ({modCount})
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openManageModal(tenant, 'modules')}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[11px] font-medium transition-colors"
                                                    >
                                                        Default ({modCount})
                                                    </button>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openManageModal(tenant, 'billing')}
                                                        className="btn btn-secondary btn-xs text-emerald-700 hover:text-emerald-800 text-xs"
                                                        title="Contact & Billing Information"
                                                    >
                                                        <CreditCardIcon className="w-3.5 h-3.5 mr-0.5" />
                                                        Billing
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadBackup(tenant)}
                                                        className="btn btn-secondary btn-xs text-xs"
                                                        title="Download complete PostgreSQL JSON backup"
                                                    >
                                                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestoreBackup(tenant)}
                                                        className="btn btn-secondary btn-xs text-amber-600 hover:text-amber-700 text-xs"
                                                        title="Restore database from snapshot JSON"
                                                    >
                                                        <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleImpersonate(tenant.tenant_id)}
                                                        className="btn btn-secondary btn-xs text-primary-600 hover:text-primary-700 text-xs"
                                                        title="Login to workspace as Tenant Administrator"
                                                    >
                                                        <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 mr-0.5" />
                                                        Admin
                                                    </button>
                                                    <button
                                                        onClick={() => openManageModal(tenant, 'overview')}
                                                        className="btn btn-primary btn-xs text-xs"
                                                    >
                                                        Manage
                                                    </button>
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

            {/* Hidden Restore File Input */}
            <input
                type="file"
                ref={restoreFileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleRestoreFileSelected}
            />

            {/* Restore Result Modal */}
            {restoreModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h3 className="text-base font-bold text-neutral-800 flex items-center gap-2">
                                <CloudArrowUpIcon className="w-5 h-5 text-primary-600" />
                                Database Restore: {restoreModal.targetTenant?.name}
                            </h3>
                            {!restoreModal.loading && (
                                <button onClick={() => setRestoreModal({ show: false, result: null, loading: false, targetTenant: null })} className="text-neutral-400 hover:text-neutral-600">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                        <div className="p-6">
                            {restoreModal.loading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="font-semibold text-neutral-800">Restoring database snapshot...</p>
                                    <p className="text-xs text-neutral-500 mt-1">Dropping existing schema and applying snapshot data</p>
                                </div>
                            ) : restoreModal.result?.error ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                                    <p className="font-bold mb-1">Restore Failed</p>
                                    <p>{restoreModal.result.error}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                                        <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                                        <div>
                                            <p className="font-bold text-sm">Restore Complete!</p>
                                            <p className="text-xs text-emerald-700">Restored {restoreModal.result?.total_restored} total rows across {restoreModal.result?.restored_tables?.length} tables.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!restoreModal.loading && (
                                <div className="flex justify-end mt-6">
                                    <button onClick={() => setRestoreModal({ show: false, result: null, loading: false, targetTenant: null })} className="btn btn-primary btn-sm">Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE NEW TENANT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h3 className="text-base font-bold text-neutral-800">Create New Company Tenant</h3>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="form-input w-full text-xs"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Corporation"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Tenant ID (Slug)</label>
                                <input
                                    type="text"
                                    name="tenantId"
                                    required
                                    pattern="[a-z0-9_]+"
                                    className="form-input w-full text-xs font-mono"
                                    value={formData.tenantId}
                                    onChange={handleInputChange}
                                    placeholder="e.g. acme_corp"
                                />
                                <p className="text-[10px] text-neutral-400 mt-1">PostgreSQL schema name. Lowercase, numbers, _ only.</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Initial Subscription Plan</label>
                                <select
                                    name="subscription_plan"
                                    className="form-input w-full text-xs font-bold"
                                    value={formData.subscription_plan}
                                    onChange={handleInputChange}
                                >
                                    {plans.map(p => (
                                        <option key={p.plan_id} value={p.plan_id}>{p.name} ({p.plan_id.toUpperCase()})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Admin Email</label>
                                <input
                                    type="email"
                                    name="adminEmail"
                                    required
                                    className="form-input w-full text-xs"
                                    value={formData.adminEmail}
                                    onChange={handleInputChange}
                                    placeholder="admin@acme.com"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    name="adminPassword"
                                    required
                                    className="form-input w-full text-xs"
                                    value={formData.adminPassword}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost text-xs">Cancel</button>
                                <button type="submit" className="btn btn-primary text-xs">Create Company</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MANAGE TENANT MODAL */}
            {manageModal.show && manageModal.tenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setManageModal({ ...manageModal, show: false })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <div>
                                <h3 className="text-base font-bold text-neutral-800">Manage: {manageModal.tenant.name}</h3>
                                <p className="text-xs text-neutral-500">
                                    <span className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded mr-2">{manageModal.tenant.tenant_id}</span>
                                    Plan: <span className="font-bold uppercase text-primary-700">{manageModal.tenant.subscription_plan || 'free'}</span>
                                </p>
                            </div>
                            <button onClick={() => setManageModal({ ...manageModal, show: false })} className="text-neutral-400 hover:text-neutral-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className="flex border-b border-neutral-200 px-6 overflow-x-auto">
                            <button
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                                    manageModal.tab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'overview' })}
                            >
                                Overview & Plan
                            </button>
                            <button
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                    manageModal.tab === 'billing' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'billing' })}
                            >
                                <CreditCardIcon className="w-4 h-4 text-emerald-600" />
                                Contact & Billing
                            </button>
                            <button
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                    manageModal.tab === 'modules' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'modules' })}
                            >
                                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                Modules & Entitlements
                                {tenantModulesData.is_custom && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">Custom</span>
                                )}
                            </button>
                            <button
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                                    manageModal.tab === 'security' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'security' })}
                            >
                                Security
                            </button>
                            <button
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                                    manageModal.tab === 'danger' ? 'border-red-600 text-red-600' : 'border-transparent text-neutral-500 hover:text-red-500'
                                }`}
                                onClick={() => setManageModal({ ...manageModal, tab: 'danger' })}
                            >
                                Danger Zone
                            </button>
                        </div>

                        <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {/* TAB 1: OVERVIEW */}
                            {manageModal.tab === 'overview' && (
                                <form onSubmit={handleManageSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Tenant Status</label>
                                            <select
                                                className="form-input w-full text-xs"
                                                value={manageFormData.status}
                                                onChange={(e) => setManageFormData({ ...manageFormData, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Subscription Plan Tier</label>
                                            <select
                                                className="form-input w-full text-xs font-bold"
                                                value={manageFormData.subscription_plan}
                                                onChange={(e) => setManageFormData({ ...manageFormData, subscription_plan: e.target.value })}
                                            >
                                                {plans.map(p => (
                                                    <option key={p.plan_id} value={p.plan_id}>{p.name} ({p.plan_id.toUpperCase()})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Subscription Expiry Date</label>
                                        <input
                                            type="date"
                                            className="form-input w-full text-xs"
                                            value={manageFormData.subscription_expiry}
                                            onChange={(e) => setManageFormData({ ...manageFormData, subscription_expiry: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Update Admin Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="form-input w-full text-xs"
                                            value={manageFormData.adminEmail || ''}
                                            onChange={(e) => setManageFormData({ ...manageFormData, adminEmail: e.target.value })}
                                            placeholder="Enter new admin email"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-neutral-100">
                                        <button type="submit" className="btn btn-primary text-xs">Save Changes</button>
                                    </div>
                                </form>
                            )}

                            {/* TAB 2: CONTACT & BILLING */}
                            {manageModal.tab === 'billing' && (
                                <div className="space-y-6">
                                    <form onSubmit={handleSaveTenantBillingProfile} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Contact Person</label>
                                                <input
                                                    type="text"
                                                    className="form-input w-full text-xs"
                                                    placeholder="Primary contact name"
                                                    value={tenantBillingProfile.contact_person}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, contact_person: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Billing Email</label>
                                                <input
                                                    type="email"
                                                    className="form-input w-full text-xs"
                                                    placeholder="billing@company.com"
                                                    value={tenantBillingProfile.contact_email}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, contact_email: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Phone Number</label>
                                                <input
                                                    type="text"
                                                    className="form-input w-full text-xs"
                                                    placeholder="+91 98765 43210"
                                                    value={tenantBillingProfile.contact_phone}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, contact_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="form-group md:col-span-2">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Billing Address</label>
                                                <input
                                                    type="text"
                                                    className="form-input w-full text-xs"
                                                    placeholder="Street / Office Address"
                                                    value={tenantBillingProfile.billing_address}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, billing_address: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Tax ID / GSTIN</label>
                                                <input
                                                    type="text"
                                                    className="form-input w-full text-xs font-mono"
                                                    placeholder="e.g. 07AAAAA0000A1Z5"
                                                    value={tenantBillingProfile.tax_id}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, tax_id: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">City</label>
                                                <input
                                                    type="text"
                                                    className="form-input w-full text-xs"
                                                    value={tenantBillingProfile.city}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, city: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Country</label>
                                                <input
                                                    type="text"
                                                    className="form-input w-full text-xs"
                                                    value={tenantBillingProfile.country}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, country: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Currency</label>
                                                <select
                                                    className="form-input w-full text-xs"
                                                    value={tenantBillingProfile.billing_currency}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, billing_currency: e.target.value })}
                                                >
                                                    <option value="INR">INR (₹)</option>
                                                    <option value="USD">USD ($)</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Billing Cycle</label>
                                                <select
                                                    className="form-input w-full text-xs"
                                                    value={tenantBillingProfile.billing_cycle}
                                                    onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, billing_cycle: e.target.value })}
                                                >
                                                    <option value="monthly">Monthly</option>
                                                    <option value="annual">Annual (Yearly)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-3 border-t border-neutral-100">
                                            <button type="submit" className="btn btn-primary text-xs">
                                                Save Contact & Billing Profile
                                            </button>
                                        </div>
                                    </form>

                                    {/* Tenant Invoices History */}
                                    <div className="pt-4 border-t border-neutral-200">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                                            <DocumentTextIcon className="w-4 h-4 text-neutral-400" />
                                            Tenant Invoices ({tenantBillingProfile.invoices?.length || 0})
                                        </h4>
                                        <div className="border border-neutral-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-neutral-50 border-b border-neutral-200">
                                                    <tr>
                                                        <th className="p-2 font-bold text-neutral-600">Date</th>
                                                        <th className="p-2 font-bold text-neutral-600">Invoice #</th>
                                                        <th className="p-2 font-bold text-neutral-600">Plan & Amount</th>
                                                        <th className="p-2 font-bold text-neutral-600">Gateway</th>
                                                        <th className="p-2 font-bold text-neutral-600">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100">
                                                    {tenantBillingProfile.invoices?.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="text-center py-4 text-neutral-400">No payment records found</td>
                                                        </tr>
                                                    ) : (
                                                        tenantBillingProfile.invoices.map((inv) => (
                                                            <tr key={inv.id} className="hover:bg-neutral-50">
                                                                <td className="p-2 text-neutral-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                                                                <td className="p-2 font-mono font-bold text-neutral-700">{inv.invoice_number || `INV-${inv.id}`}</td>
                                                                <td className="p-2 font-bold text-neutral-900">{inv.currency === 'INR' ? '₹' : '$'}{parseFloat(inv.amount).toLocaleString()}</td>
                                                                <td className="p-2 uppercase text-[10px] font-bold text-neutral-500">{inv.gateway}</td>
                                                                <td className="p-2">
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                        {inv.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: MODULES & ENTITLEMENTS */}
                            {manageModal.tab === 'modules' && (
                                <div className="space-y-4">
                                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="text-xs font-bold text-neutral-800">
                                                Status:{' '}
                                                {tenantModulesData.is_custom ? (
                                                    <span className="text-amber-700 font-bold">Custom Module Overrides Active</span>
                                                ) : (
                                                    <span className="text-primary-700 font-bold">Inheriting from Plan Default ({manageModal.tenant.subscription_plan || 'free'})</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-neutral-500">
                                                You can grant or revoke any module individually regardless of their purchased plan tier.
                                            </p>
                                        </div>

                                        {tenantModulesData.is_custom && (
                                            <button
                                                type="button"
                                                onClick={handleResetTenantModules}
                                                className="btn btn-secondary btn-xs text-xs whitespace-nowrap self-start sm:self-auto"
                                            >
                                                Reset to Plan Default
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-3 bg-white rounded-2xl border border-neutral-200 custom-scrollbar">
                                        {systemModules.map((sm) => {
                                            const isChecked = tenantModulesData.active_modules.includes(sm.key);
                                            const isCore = sm.key === 'core_hr';

                                            return (
                                                <label
                                                    key={sm.key}
                                                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                        isChecked
                                                            ? 'bg-primary-50/50 border-primary-300'
                                                            : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        disabled={isCore}
                                                        checked={isChecked}
                                                        onChange={() => handleToggleTenantModule(sm.key)}
                                                        className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <div className="text-xs">
                                                        <div className={`font-bold ${isChecked ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                                            {sm.name}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-400 line-clamp-1">{sm.description}</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                        <button
                                            type="button"
                                            onClick={handleSaveTenantModules}
                                            className="btn btn-primary text-xs"
                                        >
                                            Save Custom Modules
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: SECURITY */}
                            {manageModal.tab === 'security' && (
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 text-xs text-yellow-800 flex items-start gap-2">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                                        <span>This will reset the login password for all administrator accounts in this tenant.</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label block text-xs font-bold text-neutral-700 mb-1">New Admin Password</label>
                                        <input
                                            type="password"
                                            className="form-input w-full text-xs"
                                            value={resetPasswordData}
                                            onChange={(e) => setResetPasswordData(e.target.value)}
                                            placeholder="Enter new password (min 6 characters)"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-neutral-100">
                                        <button type="submit" className="btn btn-danger text-xs">Reset Password</button>
                                    </div>
                                </form>
                            )}

                            {/* TAB 5: DANGER ZONE */}
                            {manageModal.tab === 'danger' && (
                                <div className="space-y-4">
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 flex items-start gap-2">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                        <span>Deleting a tenant drops its PostgreSQL schema permanently. Global Super Admin accounts will remain completely safe and active.</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Super Admin 2FA Token</label>
                                        <input
                                            type="text"
                                            className="form-input w-full text-xs font-mono"
                                            value={twoFactorToken}
                                            onChange={(e) => setTwoFactorToken(e.target.value)}
                                            placeholder="Enter 6-digit 2FA code"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-neutral-100">
                                        <button type="button" onClick={handleDeleteTenant} className="btn btn-danger text-xs">
                                            Delete Tenant Permanently
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
