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

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!review) return (
        <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <FaCheckCircle size={48} className="text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700">Review not found</h3>
        </div>
    );

    const isEmployee = user.role === 'employee';
    const isManager = user.role === 'manager' || user.role === 'admin';
    const isCompleted = review.status === 'completed';

    return (
        <div className="w-full pb-8">
            <div class="page-header">
                <div>
                    <button
                        onClick={() => navigate('/performance')}
                        className="text-neutral-500 hover:text-neutral-700 mb-2 flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                        <FaArrowLeft /> Back to Performance
                    </button>
                    <h1 class="page-title">Performance Review</h1>
                    <div class="text-neutral-600 mt-1">
                        {review.cycle_title} • ID: #{review.review_id}
                    </div>
                </div>
                <div>
                    <span className={`badge ${review.status === 'completed' ? 'badge-success' :
                        review.status === 'scheduled' ? 'badge-info' : 'badge-secondary'
                        } text-sm px-3 py-1`}>
                        {review.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="card p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                            <FaUser size={20} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Employee</label>
                            <div className="text-lg font-semibold text-neutral-900">{review.employee_name}</div>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                            <FaUserTie size={20} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Reviewer</label>
                            <div className="text-lg font-semibold text-neutral-900">{review.reviewer_name || 'Not Assigned'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Self Review Section */}
                <div class="card">
                    <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold shadow-sm">1</div>
                        <h3 className="font-semibold text-neutral-800">Self Assessment</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Self Rating (1-5)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    name="self_rating"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    disabled={isCompleted || (isEmployee && review.status !== 'scheduled')}
                                    value={formData.self_rating}
                                    onChange={handleChange}
                                    className="form-input w-24 text-center font-bold"
                                />
                                <div className="flex text-yellow-400 text-xl gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < Math.round(formData.self_rating) ? 'text-yellow-400' : 'text-neutral-200'} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Your Comments</label>
                            <textarea
                                name="self_comments"
                                rows="6"
                                disabled={isCompleted || (isEmployee && review.status !== 'scheduled')}
                                value={formData.self_comments}
                                onChange={handleChange}
                                className="form-textarea w-full"
                                placeholder="Describe your key achievements, challenges faced, and areas where you've grown..."
                            ></textarea>
                        </div>

                        {isEmployee && review.status === 'scheduled' && (
                            <div className="flex justify-end pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={handleSubmitSelfReview}
                                    className="btn btn-primary"
                                >
                                    <FaCheckCircle className="mr-2" /> Submit Self Review
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Manager Review Section */}
                <div class="card">
                    <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm">2</div>
                        <h3 className="font-semibold text-neutral-800">Manager Evaluation</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Manager Rating (1-5)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    name="manager_rating"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    disabled={isCompleted || !isManager}
                                    value={formData.manager_rating}
                                    onChange={handleChange}
                                    className="form-input w-24 text-center font-bold"
                                />
                                <div className="flex text-yellow-400 text-xl gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < Math.round(formData.manager_rating) ? 'text-yellow-400' : 'text-neutral-200'} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Manager Feedback</label>
                            <textarea
                                name="manager_comments"
                                rows="6"
                                disabled={isCompleted || !isManager}
                                value={formData.manager_comments}
                                onChange={handleChange}
                                className="form-textarea w-full"
                                placeholder="Provide constructive feedback, acknowledge strengths, and suggest improvements..."
                            ></textarea>
                        </div>

                        {isManager && !isCompleted && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-secondary"
                                >
                                    <FaSave className="mr-2" /> Save Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitManagerReview}
                                    className="btn btn-primary"
                                >
                                    <FaCheckCircle className="mr-2" /> Complete Review
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PerformanceReview;
