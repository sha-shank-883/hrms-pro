import React, { useEffect, useState } from 'react';
import { departmentService } from '../services';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaBuilding } from 'react-icons/fa';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    department_name: '',
    description: '',
    budget: '',
    location: '',
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await departmentService.update(editingDept.department_id, formData);
      } else {
        await departmentService.create(formData);
      }
      loadDepartments();
      handleCloseModal();
    } catch (error) {
      alert('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.delete(id);
        loadDepartments();
      } catch (error) {
        alert('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      department_name: dept.department_name,
      description: dept.description || '',
      budget: dept.budget || '',
      location: dept.location || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDept(null);
    setFormData({ department_name: '', description: '', budget: '', location: '' });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="w-full pb-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle mt-1">Manage organization departments, budgets and locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus className="mr-2" /> Add Department
        </button>
      </div>

      <div className="card data-table-wrapper p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Description</th>
              <th>Manager</th>
              <th>Employees</th>
              <th>Budget</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-neutral-500">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-neutral-50 rounded-full mb-3">
                      <FaBuilding size={24} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-700">No departments found</h3>
                    <p className="text-sm">Create a new department to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.department_id}>
                  <td>
                    <div className="font-semibold text-neutral-900">{dept.department_name}</div>
                  </td>
                  <td className="text-neutral-500 max-w-xs truncate" title={dept.description}>{dept.description || '-'}</td>
                  <td>{dept.manager_name || <span className="text-neutral-400 italic">Unassigned</span>}</td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                      {dept.employee_count || 0} Members
                    </span>
                  </td>
                  <td className="font-mono text-neutral-700 font-medium">${dept.budget?.toLocaleString() || '0'}</td>
                  <td>{dept.location || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" onClick={() => handleEdit(dept)} title="Edit">
                        <FaEdit size={14} />
                      </button>
                      <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(dept.department_id)} title="Delete">
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-lg font-bold text-neutral-800">{editingDept ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Error handling could be improved here if 'error' state existed, using alert for now as per original code but styled better if possible, leaving original alert in catch though */}

              <div className="space-y-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Department Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    required
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Brief description of responsibilities..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Budget ($)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Building A"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100 mt-6">
                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
