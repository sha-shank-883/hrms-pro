import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import {
    Squares2X2Icon,
    AdjustmentsHorizontalIcon,
    CheckIcon,
    LockClosedIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const SuperAdminEntitlements = () => {
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [systemModules, setSystemModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenantModules, setTenantModules] = useState([]);
    const [isCustom, setIsCustom] = useState(false);

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
            console.error('Failed to load matrix data:', err);
            setError('Failed to load entitlements matrix data');
        } finally {
            setLoading(false);
        }
    };

    const openModuleEditor = async (tenant) => {
        setSelectedTenant(tenant);
        setError('');
        setSuccess('');
        try {
            const res = await tenantService.getTenantModules(tenant.tenant_id);
            setIsCustom(res.is_custom || false);
            setTenantModules(res.active_modules || []);
        } catch (err) {
            console.error('Failed to fetch tenant modules:', err);
            const planConfig = plans.find(p => p.plan_id === tenant.subscription_plan) || {};
            setTenantModules(planConfig.modules || ['core_hr']);
            setIsCustom(false);
        }
    };

    const handleToggleModule = (moduleKey) => {
        if (moduleKey === 'core_hr') return;
        setTenantModules(prev => {
            const current = new Set(prev);
            if (current.has(moduleKey)) {
                current.delete(moduleKey);
            } else {
                current.add(moduleKey);
            }
            setIsCustom(true);
            return Array.from(current);
        });
    };

    const handleSaveModules = async () => {
        try {
            setError('');
            const res = await tenantService.updateTenantModules(selectedTenant.tenant_id, {
                customModules: tenantModules
            });
            setSuccess(res.message || 'Custom modules saved for tenant');
            setSelectedTenant(null);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update tenant modules');
        }
    };

    const handleResetModules = async () => {
        if (!window.confirm('Reset this company to inherit modules from its subscription plan default?')) return;
        try {
            setError('');
            const res = await tenantService.updateTenantModules(selectedTenant.tenant_id, {
                resetToDefault: true
            });
            setSuccess(res.message || 'Reset to default plan modules');
            setSelectedTenant(null);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset modules');
        }
    };

    const filteredTenants = tenants.filter(t =>
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.tenant_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <Squares2X2Icon className="w-6 h-6 text-indigo-600 shrink-0" />
                        <span className="truncate">Tenant Module Entitlements Matrix</span>
                    </h1>
                    <p className="mt-0.5 text-xs text-neutral-500 max-w-2xl leading-relaxed">
                        Live module checklist across all companies. Easily grant custom module access regardless of purchased plan tier.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="relative w-64">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter company..."
                            className="form-input pl-8 py-1 text-xs w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={loadData} className="btn btn-secondary btn-xs text-xs">
                        <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                        Refresh
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

            {/* Matrix Legend */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl mb-4 text-xs">
                <div className="text-neutral-600 font-medium">Matrix Legend:</div>
                <div className="flex items-center gap-4 text-neutral-600">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Plan Default</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Custom Override</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-300"></span> Locked</span>
                </div>
            </div>

            {/* Live Entitlements Matrix Table */}
            <div className="card p-0 overflow-hidden border border-neutral-200 shadow-xs rounded-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/80 border-b border-neutral-200">
                                <th className="p-3 font-bold text-neutral-800 min-w-[180px] sticky left-0 bg-neutral-50 z-10">Company Tenant</th>
                                <th className="p-3 font-bold text-neutral-800 min-w-[90px]">Plan</th>
                                {systemModules.map((sm) => (
                                    <th key={sm.key} className="p-3 font-bold text-neutral-700 text-center whitespace-nowrap min-w-[95px]" title={sm.description}>
                                        {sm.name}
                                    </th>
                                ))}
                                <th className="p-3 font-bold text-neutral-800 text-right sticky right-0 bg-neutral-50 z-10">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={systemModules.length + 3} className="text-center py-8 text-neutral-500 text-xs">Loading matrix...</td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={systemModules.length + 3} className="text-center py-8 text-neutral-500 text-xs">No tenants found</td>
                                </tr>
                            ) : (
                                filteredTenants.map((t) => {
                                    const hasCustom = t.custom_modules && Array.isArray(t.custom_modules) && t.custom_modules.length > 0;
                                    const planConfig = plans.find(p => p.plan_id === t.subscription_plan) || {};
                                    const activeMods = hasCustom ? t.custom_modules : (planConfig.modules || ['core_hr']);

                                    return (
                                        <tr key={t.tenant_id} className="hover:bg-neutral-50/70 transition-colors">
                                            <td className="p-3 font-bold text-neutral-900 sticky left-0 bg-white z-10">
                                                <div>{t.name}</div>
                                                <div className="font-mono text-[10px] text-neutral-400 font-normal">{t.tenant_id}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    hasCustom ? 'bg-amber-100 text-amber-800' : 'bg-primary-50 text-primary-700'
                                                }`}>
                                                    {t.subscription_plan || 'free'}
                                                </span>
                                            </td>
                                            {systemModules.map((sm) => {
                                                const isEnabled = activeMods.includes(sm.key);
                                                return (
                                                    <td key={sm.key} className="p-3 text-center">
                                                        {isEnabled ? (
                                                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                                                                hasCustom ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                                <CheckIcon className="w-3 h-3" />
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 text-neutral-300">
                                                                <LockClosedIcon className="w-2.5 h-2.5" />
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-3 text-right sticky right-0 bg-white z-10">
                                                <button
                                                    onClick={() => openModuleEditor(t)}
                                                    className="btn btn-secondary btn-xs text-primary-600 hover:text-primary-700 text-xs"
                                                >
                                                    <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 mr-1" />
                                                    Customize
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CUSTOM MODULE OVERRIDE MODAL */}
            {selectedTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTenant(null)}>
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-3.5 border-b border-neutral-100 flex justify-between items-start gap-3 bg-neutral-50/70 shrink-0">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:text-base font-bold text-neutral-800 truncate">Customize Modules: {selectedTenant.name}</h3>
                                <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{selectedTenant.tenant_id}</span>
                                    <span>Plan: <strong className="uppercase text-primary-700">{selectedTenant.subscription_plan || 'free'}</strong></span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedTenant(null)} className="text-neutral-400 hover:text-neutral-600 shrink-0 p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
                            <div className="p-3 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2">
                                <div className="text-xs">
                                    <span className="font-bold">Status: </span>
                                    {isCustom ? (
                                        <span className="text-amber-700 font-bold">Custom Module Overrides Active</span>
                                    ) : (
                                        <span className="text-primary-700 font-bold">Inheriting from Plan Default</span>
                                    )}
                                </div>
                                {isCustom && (
                                    <button onClick={handleResetModules} className="btn btn-secondary btn-xs text-xs shrink-0">
                                        Reset to Default
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-3 bg-white rounded-2xl border border-neutral-200 custom-scrollbar">
                                {systemModules.map((sm) => {
                                    const isChecked = tenantModules.includes(sm.key);
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
                                                onChange={() => handleToggleModule(sm.key)}
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

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-100 shrink-0 mt-auto">
                                <button type="button" onClick={() => setSelectedTenant(null)} className="btn btn-ghost text-xs">Cancel</button>
                                <button type="button" onClick={handleSaveModules} className="btn btn-primary text-xs">
                                    Save Custom Modules
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminEntitlements;
