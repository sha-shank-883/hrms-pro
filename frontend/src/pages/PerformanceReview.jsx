import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaSave, FaCheckCircle, FaUser, FaUserTie, FaStar } from 'react-icons/fa';

const PerformanceReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        self_rating: '',
        self_comments: '',
        manager_rating: '',
        manager_comments: '',
        final_rating: '',
        status: ''
    });

    useEffect(() => {
        fetchReview();
    }, [id]);

    const fetchReview = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/performance/reviews/${id}`);
            setReview(res.data.data);
            setFormData({
                self_rating: res.data.data.self_rating || '',
                self_comments: res.data.data.self_comments || '',
                manager_rating: res.data.data.manager_rating || '',
                manager_comments: res.data.data.manager_comments || '',
                final_rating: res.data.data.final_rating || '',
                status: res.data.data.status
            });
        } catch (error) {
            console.error('Error fetching review:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await axios.put(`${import.meta.env.VITE_API_URL}/api/performance/reviews/${id}`, formData);
            fetchReview(); // Refresh data
            alert('Review updated successfully');
        } catch (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitSelfReview = async () => {
        if (!confirm('Are you sure you want to submit your self-review? You cannot edit it afterwards.')) return;
        try {
            setSaving(true);
            await axios.put(`${import.meta.env.VITE_API_URL}/api/performance/reviews/${id}`, {
                ...formData,
                status: 'self_review_submitted'
            });
            fetchReview();
        } catch (error) {
            console.error('Error submitting self review:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitManagerReview = async () => {
        if (!confirm('Are you sure you want to submit the manager review? This will complete the process.')) return;
        try {
            setSaving(true);
            await axios.put(`${import.meta.env.VITE_API_URL}/api/performance/reviews/${id}`, {
                ...formData,
                status: 'completed'
            });
            fetchReview();
        } catch (error) {
            console.error('Error submitting manager review:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    if (!review) return <div className="empty-state">Review not found</div>;

    const isEmployee = user.role === 'employee';
    const isManager = user.role === 'manager' || user.role === 'admin';
    const isCompleted = review.status === 'completed';

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <div className="page-header" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button
                        onClick={() => navigate('/performance')}
                        className="btn btn-secondary"
                        style={{ marginBottom: '1rem' }}
                    >
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="page-title">Performance Review</h1>
                    <div className="page-description">
                        {review.cycle_title} • ID: #{review.review_id}
                    </div>
                </div>
                <span className={`badge ${review.status === 'completed' ? 'badge-success' :
                        review.status === 'scheduled' ? 'badge-info' : 'badge-secondary'
                    }`}>
                    {review.status.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '50%', color: '#4f46e5' }}>
                            <FaUser size={20} />
                        </div>
                        <div>
                            <label className="form-label" style={{ marginBottom: '0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Employee</label>
                            <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{review.employee_name}</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: '50%', color: '#9333ea' }}>
                            <FaUserTie size={20} />
                        </div>
                        <div>
                            <label className="form-label" style={{ marginBottom: '0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Reviewer</label>
                            <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{review.reviewer_name || 'Not Assigned'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
                {/* Self Review Section */}
                <div className="card">
                    <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#4f46e5', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Self Assessment</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Self Rating (1-5)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="number"
                                name="self_rating"
                                min="1"
                                max="5"
                                step="0.1"
                                disabled={isCompleted || (isEmployee && review.status !== 'scheduled')}
                                value={formData.self_rating}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100px', textAlign: 'center', fontWeight: 'bold' }}
                            />
                            <div style={{ display: 'flex', color: '#fbbf24' }}>
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} color={i < Math.round(formData.self_rating) ? '#fbbf24' : '#e5e7eb'} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Your Comments</label>
                        <textarea
                            name="self_comments"
                            rows="6"
                            disabled={isCompleted || (isEmployee && review.status !== 'scheduled')}
                            value={formData.self_comments}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Describe your key achievements, challenges faced, and areas where you've grown..."
                        ></textarea>
                    </div>

                    {isEmployee && review.status === 'scheduled' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={handleSubmitSelfReview}
                                className="btn btn-primary"
                            >
                                <FaCheckCircle /> Submit Self Review
                            </button>
                        </div>
                    )}
                </div>

                {/* Manager Review Section */}
                <div className="card">
                    <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#9333ea', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Manager Evaluation</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Manager Rating (1-5)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="number"
                                name="manager_rating"
                                min="1"
                                max="5"
                                step="0.1"
                                disabled={isCompleted || !isManager}
                                value={formData.manager_rating}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100px', textAlign: 'center', fontWeight: 'bold' }}
                            />
                            <div style={{ display: 'flex', color: '#fbbf24' }}>
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} color={i < Math.round(formData.manager_rating) ? '#fbbf24' : '#e5e7eb'} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Manager Feedback</label>
                        <textarea
                            name="manager_comments"
                            rows="6"
                            disabled={isCompleted || !isManager}
                            value={formData.manager_comments}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Provide constructive feedback, acknowledge strengths, and suggest improvements..."
                        ></textarea>
                    </div>

                    {isManager && !isCompleted && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn btn-secondary"
                            >
                                <FaSave /> Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitManagerReview}
                                className="btn btn-primary"
                            >
                                <FaCheckCircle /> Complete Review
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PerformanceReview;
