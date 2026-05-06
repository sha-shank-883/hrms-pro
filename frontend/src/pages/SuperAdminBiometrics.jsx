import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    CpuChipIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const SuperAdminBiometrics = () => {
    const [devices, setDevices] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        tenantId: '',
        serialNumber: '',
        brand: 'ZKTeco'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [devicesData, tenantsData] = await Promise.all([
                tenantService.getBiometricDevices(),
                tenantService.getAll()
            ]);
            setDevices(devicesData || []);
            setTenants(tenantsData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
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

        try {
            await tenantService.registerBiometricDevice(formData);
            setSuccess('Device registered successfully!');
            setShowModal(false);
            setFormData({ tenantId: '', serialNumber: '', brand: 'ZKTeco' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register device');
        }
    };

    const handleDeleteDevice = async (serialNumber) => {
        if (!window.confirm(`Are you sure you want to delete device ${serialNumber}?`)) {
            return;
        }

        try {
            await tenantService.deleteBiometricDevice(serialNumber);
            setSuccess('Device deleted successfully');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete device');
        }
    };

    const filteredDevices = devices.filter(device =>
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.tenant_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full pb-8">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Biometric Devices</h1>
                    <p className="mt-1 text-neutral-600">Manage physical hardware scanners for tenants</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Register Device
                </button>
            </div>

            {error && !showModal && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}
            
            {success && !showModal && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-sm flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    {success}
                </div>
            )}

            <div className="card p-0">
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-neutral-800">All Devices</h2>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search devices..."
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
                                <th>Serial Number</th>
                                <th>Tenant</th>
                                <th>Brand</th>
                                <th>Status</th>
                                <th>Last Ping</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-neutral-500">Loading devices...</td>
                                </tr>
                            ) : filteredDevices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-neutral-500">
                                        <div className="flex flex-col items-center">
                                            <CpuChipIcon className="w-12 h-12 text-neutral-300 mb-2" />
                                            <p>No devices found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDevices.map((device) => (
                                    <tr key={device.id}>
                                        <td className="font-mono text-sm font-medium text-neutral-900">{device.serial_number}</td>
                                        <td>
                                            <div className="font-medium">{device.tenant_name || 'Unknown'}</div>
                                            <div className="text-xs text-neutral-500">{device.tenant_id}</div>
                                        </td>
                                        <td>{device.brand}</td>
                                        <td>
                                            <span className={`badge badge-${device.status === 'active' ? 'success' : 'secondary'}`}>
                                                {device.status}
                                            </span>
                                        </td>
                                        <td className="text-neutral-500 text-sm">
                                            {device.last_ping ? new Date(device.last_ping).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                className="text-red-500 hover:text-red-700 p-1"
                                                onClick={() => handleDeleteDevice(device.serial_number)}
                                                title="Delete Device"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Register Device Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h3 className="text-lg font-bold text-neutral-800">Register Physical Scanner</h3>
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
                                <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Hardware Serial Number</label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    required
                                    className="form-input w-full font-mono text-sm"
                                    value={formData.serialNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g. ZKT123456789"
                                />
                                <p className="text-xs text-neutral-500 mt-1">This exact ID must be sent by the hardware to authenticate.</p>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Assign to Tenant</label>
                                <select
                                    name="tenantId"
                                    required
                                    className="form-input w-full"
                                    value={formData.tenantId}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select a client company</option>
                                    {tenants.map(tenant => (
                                        <option key={tenant.tenant_id} value={tenant.tenant_id}>
                                            {tenant.name} ({tenant.tenant_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label block text-sm font-medium text-neutral-700 mb-1">Device Brand / Protocol</label>
                                <select
                                    name="brand"
                                    required
                                    className="form-input w-full"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                >
                                    <option value="ZKTeco">ZKTeco (ADMS)</option>
                                    <option value="Universal">Universal (JSON Agent)</option>
                                    <option value="CAMS">CAMS API</option>
                                    <option value="eSSL">eSSL</option>
                                </select>
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
                                    Register Device
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminBiometrics;
