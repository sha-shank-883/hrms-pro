import React, { useState, useEffect } from 'react';
import { assetService, employeeService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { FaLaptop, FaPlus, FaSearch, FaEdit, FaTrash, FaBoxOpen, FaUserTag, FaBuilding } from 'react-icons/fa';

const Assets = () => {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Hardware',
        serial_number: '',
        status: 'Available',
        assigned_to: '',
        department_id: '',
        purchase_date: '',
        cost: '',
        vendor: '',
        notes: ''
    });
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        status: ''
    });

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetsRes, employeesRes, departmentsRes] = await Promise.all([
                assetService.getAll(filters),
                employeeService.getAll({ limit: 1000 }), // Fetch all for assignment dropdown
                departmentService.getAll()
            ]);
            setAssets(assetsRes.data);
            setEmployees(employeesRes.data);
            setDepartments(departmentsRes.data || departmentsRes); // Handle potential different response structures
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentAsset) {
                await assetService.update(currentAsset.asset_id, formData);
            } else {
                await assetService.create(formData);
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error('Error saving asset:', error);
            alert('Failed to save asset. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await assetService.delete(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting asset:', error);
            }
        }
    };

    const openModal = (asset = null) => {
        if (asset) {
            setCurrentAsset(asset);
            setFormData({
                name: asset.name,
                type: asset.type,
                serial_number: asset.serial_number || '',
                status: asset.status,
                assigned_to: asset.assigned_to || '',
                department_id: asset.department_id || '',
                purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
                cost: asset.cost || '',
                vendor: asset.vendor || '',
                notes: asset.notes || ''
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setCurrentAsset(null);
        setFormData({
            name: '',
            type: 'Hardware',
            serial_number: '',
            status: 'Available',
            assigned_to: '',
            department_id: '',
            purchase_date: '',
            cost: '',
            vendor: '',
            notes: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'badge-success';
            case 'Assigned': return 'badge-info';
            case 'Maintenance': return 'badge-warning';
            case 'Retired': return 'badge-error';
            default: return 'badge-ghost';
        }
    };

    if (loading && !assets.length) return <div className="loading">Loading...</div>;

    return (
        <div className="w-full pb-8">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Asset Management</h1>
                    <p className="page-subtitle mt-1">Track and manage company assets.</p>
                </div>
                {(user.role === 'admin' || user.role === 'manager') && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <FaPlus className="mr-2" /> Add Asset
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-4 gap-4 p-4">
                    <div className="form-group mb-0">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><FaSearch /></span>
                            <input
                                type="text"
                                className="w-full pl-10 p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                placeholder="Search assets..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group mb-0">
                        <select
                            className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all block bg-white"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">All Types</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Software">Software</option>
                            <option value="License">License</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group mb-0">
                        <select
                            className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all block bg-white"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Retired">Retired</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Assets List */}
            <div className="card data-table-wrapper p-0">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Asset Name</th>
                            <th>Type</th>
                            <th>Serial Number</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Department</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-12 text-neutral-500">
                                    <div className="flex flex-col items-center">
                                        <div className="p-4 bg-neutral-50 rounded-full mb-3">
                                            <FaBoxOpen size={24} className="text-neutral-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-neutral-700">No assets found</h3>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            assets.map(asset => (
                                <tr key={asset.asset_id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <FaLaptop />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-neutral-900">{asset.name}</div>
                                                <div className="text-xs text-neutral-500">{asset.vendor}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{asset.type}</td>
                                    <td>{asset.serial_number || '-'}</td>
                                    <td>
                                        <span className={`badge ${asset.status === 'Available' ? 'badge-success' :
                                            asset.status === 'Assigned' ? 'badge-info' :
                                                asset.status === 'Maintenance' ? 'badge-warning' : 'badge-danger'
                                            }`}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td>
                                        {asset.assigned_to ? (
                                            <div className="flex items-center gap-2">
                                                <FaUserTag className="text-neutral-400" />
                                                <span>{asset.first_name} {asset.last_name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-neutral-400 italic">Unassigned</div>
                                        )}
                                    </td>
                                    <td>
                                        {asset.department_name ? (
                                            <div className="flex items-center gap-2">
                                                <FaBuilding className="text-neutral-400" />
                                                <span>{asset.department_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {(user.role === 'admin' || user.role === 'manager') && (
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                                    onClick={() => openModal(asset)}
                                                    title="Edit"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    onClick={() => handleDelete(asset.asset_id)}
                                                    title="Delete"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h3 className="text-lg font-bold text-neutral-800">{currentAsset ? 'Edit Asset' : 'Add New Asset'}</h3>
                            <button className="text-neutral-400 hover:text-neutral-600 transition-colors" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid sm:grid-cols-1 grid-cols-4 gap-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Asset Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all block bg-white"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Hardware">Hardware</option>
                                        <option value="Software">Software</option>
                                        <option value="License">License</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                        name="serial_number"
                                        value={formData.serial_number}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Vendor</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                        name="vendor"
                                        value={formData.vendor}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Purchase Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                        name="purchase_date"
                                        value={formData.purchase_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Cost</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all block bg-white"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Retired">Retired</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Department</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all block bg-white"
                                        name="department_id"
                                        value={formData.department_id}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            setFormData(prev => ({ ...prev, assigned_to: '' }));
                                        }}
                                    >
                                        <option value="">-- Select Department --</option>
                                        {departments.map(dept => (
                                            <option key={dept.department_id} value={dept.department_id}>
                                                {dept.department_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Assigned To</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all block bg-white"
                                        name="assigned_to"
                                        value={formData.assigned_to}
                                        onChange={handleInputChange}
                                        disabled={!formData.department_id}
                                        title={!formData.department_id ? "Please select a department first" : ""}
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {employees
                                            .filter(emp => !formData.department_id || emp.department_id === parseInt(formData.department_id))
                                            .map(emp => (
                                                <option key={emp.employee_id} value={emp.employee_id}>
                                                    {emp.first_name} {emp.last_name}
                                                </option>
                                            ))}
                                    </select>
                                    {!formData.department_id && (
                                        <small className="text-xs text-neutral-500 mt-1 block">
                                            Select a department to view employees.
                                        </small>
                                    )}
                                </div>
                            </div>
                            <div className="form-group mt-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                                <textarea
                                    className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Asset</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assets;
