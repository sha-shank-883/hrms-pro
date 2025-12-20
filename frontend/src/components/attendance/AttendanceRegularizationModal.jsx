import React, { useState } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import { attendanceService } from '../../services';

const AttendanceRegularizationModal = ({ isOpen, onClose, date, employeeId, onSuccess }) => {
    const [formData, setFormData] = useState({
        requested_clock_in: '',
        requested_clock_out: '',
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
            await attendanceService.requestRegularization({
                employee_id: employeeId,
                date: date,
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
                    <h3 className="card-title">Regularize Attendance</h3>
                    <button onClick={onClose} style={{ color: 'var(--neutral-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                        <input
                            type="text"
                            value={date}
                            disabled
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-neutral-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-md">
                        <div>
                            <label className="form-label mb-1 block">Clock In *</label>
                            <input
                                type="time"
                                required
                                value={formData.requested_clock_in}
                                onChange={(e) => setFormData({ ...formData, requested_clock_in: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block">Clock Out *</label>
                            <input
                                type="time"
                                required
                                value={formData.requested_clock_out}
                                onChange={(e) => setFormData({ ...formData, requested_clock_out: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label mb-1 block">Reason *</label>
                        <textarea
                            required
                            rows="3"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="e.g. Forgot to clock in, Technical issue..."
                            className="form-input"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-sm mt-6">
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
                            {loading ? 'Submitting...' : <><FaSave /> Submit Request</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttendanceRegularizationModal;
