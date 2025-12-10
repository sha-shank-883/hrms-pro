import React, { useEffect, useState } from 'react';
import { departmentService } from '../services';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Departments</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Department
        </button>
      </div>

      <div className="card">
        <table className="table">
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
            {departments.map((dept) => (
              <tr key={dept.department_id}>
                <td><strong>{dept.department_name}</strong></td>
                <td>{dept.description}</td>
                <td>{dept.manager_name || 'N/A'}</td>
                <td>{dept.employee_count || 0}</td>
                <td>${dept.budget?.toLocaleString() || 'N/A'}</td>
                <td>{dept.location || 'N/A'}</td>
                <td>
                  <button className="btn btn-primary" style={{ marginRight: '0.5rem', fontSize: '0.75rem' }} onClick={() => handleEdit(dept)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleDelete(dept.department_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingDept ? 'Edit Department' : 'Add Department'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Budget</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingDept ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
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
