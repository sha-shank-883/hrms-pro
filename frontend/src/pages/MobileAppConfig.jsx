import React, { useState, useEffect } from 'react';
import { mobileConfigService } from '../services';
import {
    DevicePhoneMobileIcon,
    PaintBrushIcon,
    CpuChipIcon,
    ShieldCheckIcon,
    SignalIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const MobileAppConfig = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await mobileConfigService.getAll();
            if (res.success) {
                setConfigs(res.data);
            }
        } catch (err) {
            setError('Failed to fetch mobile configurations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key, value) => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await mobileConfigService.update(key, { value });
            if (res.success) {
                setSuccess(`${key} updated successfully`);
                fetchConfigs();
            }
        } catch (err) {
            setError(`Failed to update ${key}`);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getConfigValue = (key) => {
        return configs.find(c => c.config_key === key)?.config_value || {};
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <ArrowPathIcon className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const branding = getConfigValue('mobile_branding');
    const features = getConfigValue('mobile_features');
    const maintenance = getConfigValue('mobile_maintenance');

    return (
        <div className="w-full pb-8">
            <div className="page-header mb-8">
                <div>
                    <h1 className="page-title flex items-center">
                        <DevicePhoneMobileIcon className="w-8 h-8 mr-3 text-indigo-600" />
                        Mobile App Configurator
                    </h1>
                    <p className="mt-1 text-neutral-600">Centralized management for HRMS Pro Mobile interface and features</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 flex items-center animate-in fade-in slide-in-from-top-4">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-4 flex items-center animate-in fade-in slide-in-from-top-4">
                    <CheckCircleIcon className="w-5 h-5 mr-3" />
                    {success}
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Branding Section */}
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                        <div className="flex items-center">
                            <PaintBrushIcon className="w-6 h-6 text-indigo-500 mr-3" />
                            <h2 className="text-lg font-bold text-neutral-800">Interface & Branding</h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="form-group">
                            <label className="form-label block text-sm font-semibold text-neutral-700 mb-2">Application Name</label>
                            <input
                                type="text"
                                className="form-input w-full bg-white border-neutral-200 focus:ring-indigo-500"
                                value={branding.appName || ''}
                                onChange={(e) => {
                                    const newVal = { ...branding, appName: e.target.value };
                                    handleUpdate('mobile_branding', newVal);
                                }}
                                onBlur={() => handleUpdate('mobile_branding', branding)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label block text-sm font-semibold text-neutral-700 mb-2">Primary Color</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        className="h-10 w-20 p-1 rounded border border-neutral-200 cursor-pointer"
                                        value={branding.primaryColor || '#6366f1'}
                                        onChange={(e) => {
                                            const newVal = { ...branding, primaryColor: e.target.value };
                                            setConfigs(prev => prev.map(c => c.config_key === 'mobile_branding' ? { ...c, config_value: newVal } : c));
                                        }}
                                        onBlur={(e) => handleUpdate('mobile_branding', { ...branding, primaryColor: e.target.value })}
                                    />
                                    <span className="font-mono text-sm text-neutral-500 uppercase">{branding.primaryColor}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label block text-sm font-semibold text-neutral-700 mb-2">Accent Color</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        className="h-10 w-20 p-1 rounded border border-neutral-200 cursor-pointer"
                                        value={branding.accentColor || '#4f46e5'}
                                        onChange={(e) => {
                                            const newVal = { ...branding, accentColor: e.target.value };
                                            setConfigs(prev => prev.map(c => c.config_key === 'mobile_branding' ? { ...c, config_value: newVal } : c));
                                        }}
                                        onBlur={(e) => handleUpdate('mobile_branding', { ...branding, accentColor: e.target.value })}
                                    />
                                    <span className="font-mono text-sm text-neutral-500 uppercase">{branding.accentColor}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Live Preview (Mobile Simulation)</h3>
                            <div className="w-48 h-24 bg-white rounded-2xl shadow-lg border border-neutral-100 mx-auto overflow-hidden relative">
                                <div style={{ backgroundColor: branding.primaryColor }} className="h-6 w-full flex items-center px-3">
                                    <div className="h-1.5 w-8 bg-white/30 rounded-full" />
                                </div>
                                <div className="p-3">
                                    <div className="h-2 w-20 bg-neutral-100 rounded mb-2" />
                                    <div style={{ backgroundColor: branding.accentColor }} className="h-6 w-12 rounded-lg" />
                                </div>
                                <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full" style={{ backgroundColor: branding.primaryColor }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex items-center">
                        <CpuChipIcon className="w-6 h-6 text-emerald-500 mr-3" />
                        <h2 className="text-lg font-bold text-neutral-800">App Capabilities</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            { id: 'enableChat', label: 'Real-time Chat Engine', icon: ShieldCheckIcon, desc: 'Enables encrypted messaging module' },
                            { id: 'enableBiometrics', label: 'Biometric Security', icon: SignalIcon, desc: 'Fingerprint & FaceID authentication' },
                            { id: 'enableGeofencing', label: 'Smart Geofencing', icon: SignalIcon, desc: 'GPS-based attendance validation' },
                            { id: 'enableFaceId', label: 'Advanced Face Detection', icon: SignalIcon, desc: 'AI-driven identity verification' }
                        ].map((feature) => (
                            <div key={feature.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center">
                                    <div className="p-2 bg-white rounded-lg border border-neutral-200 mr-4">
                                        <feature.icon className="w-5 h-5 text-neutral-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-neutral-800">{feature.label}</p>
                                        <p className="text-xs text-neutral-500">{feature.desc}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={features[feature.id] || false}
                                        onChange={() => {
                                            const newVal = { ...features, [feature.id]: !features[feature.id] };
                                            handleUpdate('mobile_features', newVal);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Maintenance Section */}
                <div className="card overflow-hidden lg:col-span-2">
                    <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex items-center">
                        <SignalIcon className="w-6 h-6 text-red-500 mr-3" />
                        <h2 className="text-lg font-bold text-neutral-800">System Status & Versioning</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-neutral-800">Maintenance Mode</p>
                                        <p className="text-xs text-neutral-500">Locks app for all users</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={maintenance.isUnderMaintenance || false}
                                            onChange={() => {
                                                const newVal = { ...maintenance, isUnderMaintenance: !maintenance.isUnderMaintenance };
                                                handleUpdate('mobile_maintenance', newVal);
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-sm font-semibold text-neutral-700 mb-2">Maintenance Message</label>
                                    <textarea
                                        className="form-input w-full bg-white border-neutral-200"
                                        rows="2"
                                        value={maintenance.message || ''}
                                        onChange={(e) => {
                                            const newVal = { ...maintenance, message: e.target.value };
                                            setConfigs(prev => prev.map(c => c.config_key === 'mobile_maintenance' ? { ...c, config_value: newVal } : c));
                                        }}
                                        onBlur={(e) => handleUpdate('mobile_maintenance', { ...maintenance, message: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="form-group">
                                    <label className="form-label block text-sm font-semibold text-neutral-700 mb-2">Minimum App Version</label>
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            className="form-input w-full"
                                            value={maintenance.minAppVersion || '1.0.0'}
                                            placeholder="e.g. 1.2.0"
                                            onChange={(e) => {
                                                const newVal = { ...maintenance, minAppVersion: e.target.value };
                                                setConfigs(prev => prev.map(c => c.config_key === 'mobile_maintenance' ? { ...c, config_value: newVal } : c));
                                            }}
                                            onBlur={(e) => handleUpdate('mobile_maintenance', { ...maintenance, minAppVersion: e.target.value })}
                                        />
                                        <div className="ml-3 p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                            <InformationCircleIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2">Users below this version will be forced to update.</p>
                                </div>
                            </div>

                            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                                <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-3" />
                                <h3 className="text-sm font-bold text-red-900">Critical Actions</h3>
                                <p className="text-xs text-red-700 mb-4">Changes here affect the entire mobile fleet instantly.</p>
                                <button 
                                    onClick={() => handleUpdate('mobile_maintenance', maintenance)}
                                    className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    PUSH GLOBAL UPDATE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileAppConfig;
