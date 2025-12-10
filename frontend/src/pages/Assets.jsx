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
        <div className="container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Asset Management</h1>
                    <p className="page-description">Track and manage company assets.</p>
                </div>
                {(user.role === 'admin' || user.role === 'manager') && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <FaPlus /> Add Asset
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <div className="input-group">
                            <span className="input-group-text"><FaSearch /></span>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search assets..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                            className="form-input"
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
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                            className="form-input"
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
            <div className="card">
                <div className="table-responsive">
                    <table className="table">
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
                            {assets.length > 0 ? (
                                assets.map(asset => (
                                    <tr key={asset.asset_id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    background: '#e0e7ff', color: '#4f46e5',
                                                    padding: '0.5rem', borderRadius: '0.375rem'
                                                }}>
                                                    <FaLaptop />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{asset.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{asset.vendor}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{asset.type}</td>
                                        <td>{asset.serial_number || '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusColor(asset.status)}`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td>
                                            {asset.assigned_to ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FaUserTag style={{ color: '#9ca3af' }} />
                                                    <span>{asset.first_name} {asset.last_name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#9ca3af' }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            {asset.department_name ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FaBuilding style={{ color: '#9ca3af' }} />
                                                    <span>{asset.department_name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#9ca3af' }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {(user.role === 'admin' || user.role === 'manager') && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => openModal(asset)}
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleDelete(asset.asset_id)}
                                                        title="Delete"
                                                        style={{ color: '#ef4444' }}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#9ca3af' }}>
                                            <FaBoxOpen size={32} />
                                            <p>No assets found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{currentAsset ? 'Edit Asset' : 'Add New Asset'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Asset Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-input"
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
                                        <label className="form-label">Serial Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            name="serial_number"
                                            value={formData.serial_number}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Vendor</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            name="vendor"
                                            value={formData.vendor}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Purchase Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            name="purchase_date"
                                            value={formData.purchase_date}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cost</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            name="cost"
                                            value={formData.cost}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-input"
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
                                        <label className="form-label">Department</label>
                                        <select
                                            className="form-input"
                                            name="department_id"
                                            value={formData.department_id}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                setFormData(prev => ({ ...prev, assigned_to: '' })); // Reset assigned_to when department changes
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
                                        <label className="form-label">Assigned To</label>
                                        <select
                                            className="form-input"
                                            name="assigned_to"
                                            value={formData.assigned_to}
                                            onChange={handleInputChange}
                                            disabled={!formData.department_id} // Disable if no department selected
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
                                            <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                                                Select a department to view employees.
                                            </small>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-input"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
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
