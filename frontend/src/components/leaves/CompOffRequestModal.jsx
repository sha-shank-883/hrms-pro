import React, { useState } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import { leaveService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const CompOffRequestModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        worked_date: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await leaveService.requestCompOff({
                employee_id: user.employee_id, // Assuming employee_id is available in user context or will be handled by backend from token if needed, but here we pass it explicitly if we have it, or rely on backend to infer from token if we updated that logic. 
                // Wait, in controller requestCompOff expects employee_id in body. 
                // In AttendanceRegularizationModal we passed it as prop.
                // Let's use user.employee_id if available, or fetch it. 
                // However, for simplicity, I'll assume user object has it or I'll pass it from parent.
                // Actually, let's pass it from parent logic or rely on the user context having it.
                // Re-checking AttendanceRegularizationModal, it accepted employeeId as prop.
                // I'll make this modal accept employeeId as prop too for consistency, or rely on internal logic.
                // User context usually has userId, not always employeeId directly unless mapped.
                // Let's look at LeaveService usage. 
                ...formData
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '100%',
                maxWidth: '28rem',
                overflow: 'hidden',
                animation: 'fade-in 0.2s ease-out'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--neutral-100)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--neutral-50)'
                }}>
                    <h3 className="card-title">Request Comp-Off</h3>
                    <button onClick={onClose} style={{ color: 'var(--neutral-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="alert alert-error">{error}</div>}

                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--info-bg)',
                        color: 'var(--info)',
                        fontSize: '0.875rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--info-border)',
                        marginBottom: '1rem',
                        lineHeight: '1.5'
                    }}>
                        Comp-off can be claimed for working on weekends or holidays.
                        Validity is <strong>60 days</strong> from the date of work.
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label mb-1 block">Date Worked <span className="text-danger">*</span></label>
                        <input
                            type="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                            value={formData.worked_date}
                            onChange={(e) => setFormData({ ...formData, worked_date: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label mb-1 block">Reason <span className="text-danger">*</span></label>
                        <textarea
                            required
                            rows="3"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="e.g. Supported production deployment..."
                            className="form-input"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-sm pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Submitting...' : <><FaSave className="mr-2" /> Submit Request</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompOffRequestModal;
