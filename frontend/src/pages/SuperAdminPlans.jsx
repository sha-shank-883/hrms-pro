import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import {
    SparklesIcon,
    AdjustmentsHorizontalIcon,
    CheckIcon,
    LockClosedIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const SuperAdminPlans = () => {
    const [plans, setPlans] = useState([]);
    const [systemModules, setSystemModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [editingPlan, setEditingPlan] = useState(null);
    const [planFormData, setPlanFormData] = useState({
        name: '',
        description: '',
        price_inr: 0,
        price_usd: 0,
        employee_limit: 15,
        modules: []
    });

    useEffect(() => {
        loadPlansData();
    }, []);

    const loadPlansData = async () => {
        setLoading(true);
        try {
            const res = await tenantService.getPlanConfigs();
            if (res?.plans) setPlans(res.plans);
            if (res?.systemModules) setSystemModules(res.systemModules);
        } catch (err) {
            console.error('Failed to load plan configs:', err);
            setError('Failed to load subscription plan configurations');
        } finally {
            setLoading(false);
        }
    };

    const openPlanEditor = (plan) => {
        setEditingPlan(plan);
        setPlanFormData({
            name: plan.name,
            description: plan.description || '',
            price_inr: plan.price_inr || 0,
            price_usd: plan.price_usd || 0,
            employee_limit: plan.employee_limit || 15,
            modules: Array.isArray(plan.modules) ? plan.modules : []
        });
        setError('');
        setSuccess('');
    };

    const handleToggleModule = (moduleKey) => {
        setPlanFormData(prev => {
            const current = new Set(prev.modules);
            if (current.has(moduleKey)) {
                if (moduleKey === 'core_hr') return prev;
                current.delete(moduleKey);
            } else {
                current.add(moduleKey);
            }
            return {
                ...prev,
                modules: Array.from(current)
            };
        });
    };

    const handleSavePlanConfig = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const res = await tenantService.updatePlanConfig(editingPlan.plan_id, planFormData);
            setSuccess(res.message || 'Plan configuration saved successfully');
            setEditingPlan(null);
            loadPlansData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update plan configuration');
        }
    };

    return (
        <div className="w-full pb-8">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="page-title text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-primary-600" />
                        Subscription Plan Tiers & Default Modules
                    </h1>
                    <p className="mt-0.5 text-xs text-neutral-500">
                        Configure pricing, seat limits, and default active modules included in each customer tier
                    </p>
                </div>
                <button onClick={loadPlansData} className="btn btn-secondary btn-xs text-xs">
                    <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                    Refresh
                </button>
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

            {/* 4-Column Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-5">
                {plans.map((plan) => {
                    const planModules = Array.isArray(plan.modules) ? plan.modules : [];

                    return (
                        <div key={plan.plan_id} className="card p-5 flex flex-col justify-between hover:shadow-md transition-all border border-neutral-200 hover:border-primary-400 rounded-2xl bg-white relative">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-800 border border-primary-100">
                                        {plan.plan_id}
                                    </span>
                                    <span className="text-[11px] font-bold text-neutral-500">
                                        Up to {plan.employee_limit} seats
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-neutral-900 mt-1">{plan.name}</h3>
                                <p className="text-xs text-neutral-500 mt-0.5 min-h-[32px]">{plan.description}</p>

                                <div className="my-3.5 py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <div className="text-base font-black text-neutral-900">
                                        ₹{plan.price_inr} <span className="text-[11px] font-normal text-neutral-500">/ user / mo</span>
                                    </div>
                                    <div className="text-[11px] text-neutral-400 mt-0.5">
                                        (${plan.price_usd} USD / user / mo)
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center justify-between">
                                        <span>Included Modules:</span>
                                        <span className="text-primary-600 font-black">{planModules.length}</span>
                                    </div>
                                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                        {systemModules.map((sm) => {
                                            const isEnabled = planModules.includes(sm.key);
                                            return (
                                                <div key={sm.key} className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg ${
                                                    isEnabled ? 'bg-emerald-50 text-emerald-900 font-medium' : 'text-neutral-400 bg-neutral-50/70 line-through'
                                                }`}>
                                                    <span className="truncate">{sm.name}</span>
                                                    {isEnabled ? (
                                                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    ) : (
                                                        <LockClosedIcon className="w-3 h-3 text-neutral-300 shrink-0" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => openPlanEditor(plan)}
                                className="w-full mt-3 btn btn-primary btn-xs flex items-center justify-center gap-1.5"
                            >
                                <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                                Edit Tier Modules & Pricing
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* EDIT PLAN MODAL */}
            {editingPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditingPlan(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-primary-50/50">
                            <div>
                                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-primary-600" />
                                    Configure Tier: {editingPlan.name}
                                </h3>
                                <p className="text-xs text-neutral-500">Plan Identifier: <span className="font-mono font-bold">{editingPlan.plan_id}</span></p>
                            </div>
                            <button onClick={() => setEditingPlan(null)} className="text-neutral-400 hover:text-neutral-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePlanConfig} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Plan Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input w-full text-xs font-bold"
                                        value={planFormData.name}
                                        onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Employee Limit (Seats)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="form-input w-full text-xs font-bold"
                                        value={planFormData.employee_limit}
                                        onChange={(e) => setPlanFormData({ ...planFormData, employee_limit: parseInt(e.target.value) || 15 })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Price (INR / user / mo)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input w-full text-xs font-bold"
                                        value={planFormData.price_inr}
                                        onChange={(e) => setPlanFormData({ ...planFormData, price_inr: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Price (USD / user / mo)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="form-input w-full text-xs font-bold"
                                        value={planFormData.price_usd}
                                        onChange={(e) => setPlanFormData({ ...planFormData, price_usd: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Description</label>
                                <textarea
                                    className="form-input w-full text-xs"
                                    rows="2"
                                    value={planFormData.description}
                                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="form-label block text-xs font-bold text-neutral-700">
                                        Included System Modules ({planFormData.modules.length} selected):
                                    </label>
                                    <span className="text-[11px] text-neutral-400">Core HR is always mandatory</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 bg-neutral-50 rounded-2xl border border-neutral-200 custom-scrollbar">
                                    {systemModules.map((sm) => {
                                        const isChecked = planFormData.modules.includes(sm.key);
                                        const isCore = sm.key === 'core_hr';

                                        return (
                                            <label
                                                key={sm.key}
                                                className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                                    isChecked
                                                        ? 'bg-white border-primary-300 shadow-xs'
                                                        : 'bg-neutral-100/60 border-neutral-200 text-neutral-400'
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
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button type="button" onClick={() => setEditingPlan(null)} className="btn btn-ghost text-xs">Cancel</button>
                                <button type="submit" className="btn btn-primary text-xs">Save Plan Configuration</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPlans;
