import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { performanceService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    FaTrophy,
    FaChartLine,
    FaClipboardList,
    FaPlus,
    FaEdit,
    FaTrash,
    FaCheck,
    FaCalendarAlt,
    FaUserTie,
    FaSearch
} from 'react-icons/fa';

const Performance = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('goals');
    const [goals, setGoals] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [newGoal, setNewGoal] = useState({ title: '', description: '', due_date: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [goalsRes, reviewsRes, cyclesRes] = await Promise.all([
                performanceService.getGoals(),
                performanceService.getReviews(),
                performanceService.getCycles()
            ]);
            setGoals(goalsRes.data || goalsRes);
            setReviews(reviewsRes.data || reviewsRes);
            setCycles(cyclesRes.data || cyclesRes);
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateOrUpdateGoal = async (e) => {
        e.preventDefault();
        try {
            if (editingGoal) {
                await performanceService.updateGoal(editingGoal.goal_id, newGoal);
            } else {
                await performanceService.createGoal(newGoal);
            }
            setShowGoalModal(false);
            setEditingGoal(null);
            setNewGoal({ title: '', description: '', due_date: '' });
            fetchData();
        } catch (error) {
            console.error('Error saving goal:', error);
        }
    };

    const handleEditGoal = (goal) => {
        setEditingGoal(goal);
        setNewGoal({
            title: goal.title,
            description: goal.description,
            due_date: goal.due_date ? goal.due_date.split('T')[0] : ''
        });
        setShowGoalModal(true);
    };

    const handleDeleteGoal = async (id) => {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        try {
            await performanceService.deleteGoal(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleUpdateProgress = async (goalId, progress) => {
        try {
            await performanceService.updateGoal(goalId, { progress });
            fetchData();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            {/* Header */}
            <div className="page-header" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Performance Center</h1>
                    <p className="page-description">Track your professional growth and achievements</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGoal(null);
                        setNewGoal({ title: '', description: '', due_date: '' });
                        setShowGoalModal(true);
                    }}
                    className="btn btn-primary"
                >
                    <FaPlus /> Set New Goal
                </button>
            </div>

            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#e0e7ff', padding: '0.75rem', borderRadius: '0.5rem', color: '#4f46e5' }}>
                            <FaTrophy size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Total Goals</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{goals.length}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>active goals</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#f3e8ff', padding: '0.75rem', borderRadius: '0.5rem', color: '#9333ea' }}>
                            <FaChartLine size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Avg. Progress</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>
                            {goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0}%
                        </h3>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>completion rate</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '0.5rem', color: '#059669' }}>
                            <FaClipboardList size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Reviews</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{reviews.length}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>completed cycles</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('goals')}
                        style={{
                            paddingBottom: '1rem',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: activeTab === 'goals' ? '#4f46e5' : '#9ca3af',
                            borderBottom: activeTab === 'goals' ? '2px solid #4f46e5' : 'none',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'goals' ? '2px solid #4f46e5' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        My Goals
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        style={{
                            paddingBottom: '1rem',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: activeTab === 'reviews' ? '#4f46e5' : '#9ca3af',
                            borderBottom: activeTab === 'reviews' ? '2px solid #4f46e5' : 'none',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'reviews' ? '2px solid #4f46e5' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Performance Reviews
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div>
                {/* Goals Content */}
                {activeTab === 'goals' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {goals.map((goal) => (
                            <div key={goal.goal_id} className="card" style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>{goal.title}</h3>
                                        <span className={`badge ${goal.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                            {goal.status === 'completed' && <FaCheck size={10} style={{ marginRight: '4px' }} />}
                                            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEditGoal(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeleteGoal(goal.goal_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', height: '2.5rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{goal.description}</p>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                                        <span>Progress</span>
                                        <span style={{ color: '#4f46e5' }}>{goal.progress}%</span>
                                    </div>
                                    <div style={{ width: '100%', background: '#f3f4f6', borderRadius: '9999px', height: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
                                        <div
                                            style={{ width: `${goal.progress}%`, background: 'linear-gradient(to right, #6366f1, #a855f7)', height: '100%', borderRadius: '9999px', transition: 'width 1s ease-out' }}
                                        ></div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500' }}>
                                            <FaCalendarAlt style={{ marginRight: '0.375rem' }} />
                                            {new Date(goal.due_date).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={() => handleUpdateProgress(goal.goal_id, Math.min(100, goal.progress + 10))}
                                            style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4f46e5', background: '#e0e7ff', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                                        >
                                            +10%
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {goals.length === 0 && (
                            <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '1rem', border: '2px dashed #e5e7eb' }}>
                                <div className="empty-state-icon">
                                    <FaTrophy />
                                </div>
                                <h3 className="empty-state-title">No goals set yet</h3>
                                <p className="empty-state-description">Set clear goals to track your professional development and achieve new milestones.</p>
                                <button
                                    onClick={() => setShowGoalModal(true)}
                                    className="btn btn-primary"
                                >
                                    Create Your First Goal
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Reviews Content */}
                {activeTab === 'reviews' && (
                    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Cycle</th>
                                    <th>Employee</th>
                                    <th>Reviewer</th>
                                    <th>Status</th>
                                    <th>Rating</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map((review) => (
                                    <tr key={review.review_id}>
                                        <td>
                                            <div style={{ fontWeight: 'bold', color: '#111827' }}>{review.cycle_title}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div style={{ height: '2rem', width: '2rem', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 'bold', fontSize: '0.75rem', marginRight: '0.75rem' }}>
                                                    {review.employee_name.charAt(0)}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>{review.employee_name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{review.reviewer_name || 'Pending Assignment'}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${review.status === 'completed' ? 'badge-success' :
                                                review.status === 'scheduled' ? 'badge-info' : 'badge-secondary'
                                                }`}>
                                                {review.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111827' }}>{review.final_rating || '-'}</div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => navigate(`/performance/review/${review.review_id}`)}
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
                                            <div className="empty-state">
                                                <div className="empty-state-icon">
                                                    <FaClipboardList />
                                                </div>
                                                <h3 className="empty-state-title">No reviews found</h3>
                                                <p className="empty-state-description">Performance reviews will appear here once scheduled.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Goal Modal */}
            {showGoalModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px', width: '100%' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{editingGoal ? 'Edit Goal' : 'Set New Goal'}</h2>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Define your objectives and success criteria</p>
                        </div>

                        <form onSubmit={handleCreateOrUpdateGoal}>
                            <div className="form-group">
                                <label className="form-label">Goal Title</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g., Complete Advanced React Course"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows="4"
                                    placeholder="Describe the details and success criteria..."
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                    style={{ resize: 'none' }}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="form-input"
                                    value={newGoal.due_date}
                                    onChange={(e) => setNewGoal({ ...newGoal, due_date: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowGoalModal(false)}
                                    className="btn btn-secondary"
                                    style={{ background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Performance;
