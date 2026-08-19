import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { performanceService, aiIntelligenceService } from '../services';
import { useAuth } from '../context/AuthContext';
import AIModal from '../components/ai/AIModal';
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
    FaSearch,
    FaList,
    FaBullseye,
    FaArrowRight,
    FaWeightHanging,
    FaFlag,
    FaTimes,
    FaRobot,
    FaMagic,
    FaCheckSquare
} from 'react-icons/fa';
import { FiAward, FiTrendingUp, FiTarget } from 'react-icons/fi';

const Performance = () => {
    const navigate = useNavigate();
    const { user, hasModule } = useAuth();
    const [activeTab, setActiveTab] = useState('goals');
    const [goals, setGoals] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    // AI Performance Review States
    const [showAiPerfModal, setShowAiPerfModal] = useState(false);
    const [aiPerfLoading, setAiPerfLoading] = useState(false);
    const [aiPerfError, setAiPerfError] = useState('');
    const [aiPerfResult, setAiPerfResult] = useState(null);
    const [activePerfReview, setActivePerfReview] = useState(null);

    const handleGenerateAiPerformanceReview = async (review) => {
        setActivePerfReview(review);
        setShowAiPerfModal(true);
        setAiPerfLoading(true);
        setAiPerfError('');
        setAiPerfResult(null);

        try {
            const res = await aiIntelligenceService.generatePerformanceSummary({
                employeeId: review.employee_id,
                employeeName: review.employee_name,
                period: review.cycle_title,
                managerNotes: review.notes || review.feedback
            });
            setAiPerfResult(res.data);
        } catch (err) {
            setAiPerfError(err.response?.data?.message || err.message || 'Failed to generate AI performance summary');
        } finally {
            setAiPerfLoading(false);
        }
    };
    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        due_date: '',
        category: 'General',
        priority: 'medium',
        weightage: 0,
        key_results: []
    });
    const [newKR, setNewKR] = useState({ title: '', metric_type: 'percentage', target_value: 100 });

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
            setNewGoal({
                title: '',
                description: '',
                due_date: '',
                category: 'General',
                priority: 'medium',
                weightage: 0,
                key_results: []
            });
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
            due_date: goal.due_date ? goal.due_date.split('T')[0] : '',
            category: goal.category || 'General',
            priority: goal.priority || 'medium',
            weightage: goal.weightage || 0,
            key_results: goal.key_results || []
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

    const handleAddKR = () => {
        if (!newKR.title) return;
        setNewGoal(prev => ({
            ...prev,
            key_results: [...prev.key_results, { ...newKR, current_value: 0 }]
        }));
        setNewKR({ title: '', metric_type: 'percentage', target_value: 100 });
    };

    const handleRemoveKR = (index) => {
        setNewGoal(prev => ({
            ...prev,
            key_results: prev.key_results.filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

    return (
        <div className="w-full pb-8">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance Center</h1>
                    <p className="text-neutral-600 mt-1">Track your professional growth and achievements</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGoal(null);
                        setNewGoal({
                            title: '',
                            description: '',
                            due_date: '',
                            category: 'General',
                            priority: 'medium',
                            weightage: 0,
                            key_results: []
                        });
                        setShowGoalModal(true);
                    }}
                    className="btn btn-primary"
                >
                    <FaPlus /> Set New Goal
                </button>
            </div>

            {/* Stats Overview Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                            <FaTrophy size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Total Goals</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold text-neutral-900 leading-none">{goals.length}</h3>
                        <span className="text-sm text-neutral-500 mb-1">active goals</span>
                    </div>
                </div>
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 rounded-lg bg-secondary-50 text-secondary-600">
                            <FaChartLine size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Avg. Progress</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold text-neutral-900 leading-none">
                            {goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0}%
                        </h3>
                        <span className="text-sm text-neutral-500 mb-1">completion rate</span>
                    </div>
                </div>
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                            <FaClipboardList size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Reviews</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold text-neutral-900 leading-none">{reviews.length}</h3>
                        <span className="text-sm text-neutral-500 mb-1">completed cycles</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 mb-6">
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'goals' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setActiveTab('goals')}
                >
                    <div className="flex items-center gap-2">
                        <FaBullseye /> My Goals
                    </div>
                    {activeTab === 'goals' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'reviews' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    <div className="flex items-center gap-2">
                        <FaClipboardList /> Performance Reviews
                    </div>
                    {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
            </div>

            {/* Content Area */}
            <div>
                {/* Goals Content */}
                {activeTab === 'goals' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {goals.length === 0 ? (
                            <div className="col-span-full card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-neutral-200 shadow-none">
                                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 text-neutral-300">
                                    <FaTrophy size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-800 mb-2">No goals set yet</h3>
                                <p className="text-neutral-500 max-w-md mb-6">Set clear goals to track your professional development and achieve new milestones.</p>
                                <button
                                    onClick={() => setShowGoalModal(true)}
                                    className="btn btn-primary"
                                >
                                    <FaPlus /> Create Your First Goal
                                </button>
                            </div>
                        ) : (
                            goals.map((goal) => (
                                <div key={goal.goal_id} className="card flex flex-col h-full hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider border
                                                    ${goal.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        goal.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                            goal.priority === 'low' ? 'bg-neutral-50 text-neutral-600 border-neutral-200' :
                                                                'bg-primary-50 text-blue-700 border-primary-100'}`}>
                                                    {goal.priority || 'Medium'}
                                                </span>
                                                <span className="text-xs text-neutral-500 font-medium px-2 py-0.5 bg-neutral-50 rounded border border-neutral-100">
                                                    {goal.category || 'General'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-neutral-900 mb-1 leading-tight">{goal.title}</h3>
                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${goal.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {goal.status === 'completed' && <FaCheck size={10} />}
                                                <span className="capitalize">{goal.status}</span>
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditGoal(goal)} className="p-1.5 text-neutral-400 hover:text-primary-600 transition-colors rounded hover:bg-neutral-50">
                                                <FaEdit size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteGoal(goal.goal_id)} className="p-1.5 text-neutral-400 hover:text-danger transition-colors rounded hover:bg-neutral-50">
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2 min-h-[2.5rem] flex-grow">{goal.description}</p>

                                    {/* Key Results Section (Mini) */}
                                    {goal.key_results && goal.key_results.length > 0 && (
                                        <div className="mb-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                            <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-1">
                                                <FaBullseye size={10} /> Key Results
                                            </h4>
                                            <div className="space-y-2">
                                                {goal.key_results.slice(0, 3).map((kr, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className="truncate flex-1 pr-2 text-neutral-700 text-xs" title={kr.title}>• {kr.title}</span>
                                                        <span className="text-primary-600 font-bold text-xs whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                                                            {kr.current_value} / {kr.target_value} {kr.metric_type === 'percentage' ? '%' : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                                {goal.key_results.length > 3 && (
                                                    <div className="text-xs text-center text-neutral-400 italic">
                                                        + {goal.key_results.length - 3} more...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4 border-t border-neutral-100">
                                        <div className="flex justify-between text-xs font-semibold text-neutral-500 mb-2">
                                            <span>Overall Progress</span>
                                            <span className="text-primary-600">{goal.progress}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 rounded-full h-2 mb-4 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary-500 to-primary-600"
                                                style={{ width: `${goal.progress}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center text-xs text-neutral-400 font-medium">
                                                <FaCalendarAlt className="mr-1.5" />
                                                {new Date(goal.due_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center text-xs text-neutral-400 font-medium" title="Weightage">
                                                <FaWeightHanging className="mr-1.5" />
                                                {goal.weightage || 0}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Reviews Content */}
                {activeTab === 'reviews' && (
                    <div className="card p-0">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Cycle</th>
                                    <th>Employee</th>
                                    <th>Reviewer</th>
                                    <th>Status</th>
                                    <th>Rating</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-neutral-500">
                                            <div className="flex flex-col items-center">
                                                <FaClipboardList size={32} className="text-neutral-300 mb-2" />
                                                <p>No performance reviews found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reviews.map((review) => (
                                        <tr key={review.review_id} className="group hover:bg-neutral-50">
                                            <td className="font-semibold text-neutral-900">{review.cycle_title}</td>
                                            <td>
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs mr-3">
                                                        {review.employee_name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-neutral-900">{review.employee_name}</span>
                                                </div>
                                            </td>
                                            <td className="text-neutral-500 text-sm">
                                                {review.reviewer_name || <span className="italic text-neutral-400">Pending Assignment</span>}
                                            </td>
                                            <td>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    review.status === 'scheduled' ? 'bg-primary-100 text-blue-800' :
                                                        'bg-neutral-100 text-neutral-800'
                                                    }`}>
                                                    {review.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="font-bold text-neutral-900">
                                                {review.final_rating || '-'}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {hasModule('ai_assistant') && (
                                                        <button
                                                            onClick={() => handleGenerateAiPerformanceReview(review)}
                                                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200/60 shadow-xs transition-colors"
                                                            title="Generate AI Review Summary"
                                                        >
                                                            <FaMagic size={11} className="text-indigo-500" /> AI Review
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/performance/review/${review.review_id}`)}
                                                        className="btn btn-secondary text-xs py-1.5"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Goal Modal */}
            {
                showGoalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-800">{editingGoal ? 'Edit Goal' : 'Set New Goal'}</h2>
                                    <p className="text-sm text-neutral-500">Define your objectives and success criteria</p>
                                </div>
                                <button onClick={() => setShowGoalModal(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                    <FaTimes size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateOrUpdateGoal} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Goal Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                            placeholder="e.g., Complete Advanced React Course"
                                            value={newGoal.title}
                                            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                                        <textarea
                                            className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                                            rows="3"
                                            placeholder="Describe the details and success criteria..."
                                            value={newGoal.description}
                                            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none"
                                                value={newGoal.due_date}
                                                onChange={(e) => setNewGoal({ ...newGoal, due_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                            <select
                                                className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none bg-white"
                                                value={newGoal.category}
                                                onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                                            >
                                                <option value="General">General</option>
                                                <option value="Development">Development</option>
                                                <option value="Project">Project</option>
                                                <option value="Process">Process</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                                            <select
                                                className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none bg-white"
                                                value={newGoal.priority}
                                                onChange={e => setNewGoal({ ...newGoal, priority: e.target.value })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Weightage (%)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none"
                                                value={newGoal.weightage}
                                                onChange={e => setNewGoal({ ...newGoal, weightage: e.target.value })}
                                                min="0" max="100"
                                            />
                                        </div>
                                    </div>

                                    {/* Key Results Input */}
                                    <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                                        <h4 className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
                                            <FaBullseye className="text-primary-600" /> Key Results
                                        </h4>

                                        <div className="flex gap-2 mb-3 items-end">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none"
                                                    placeholder="Key result title..."
                                                    value={newKR.title}
                                                    onChange={e => setNewKR({ ...newKR, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    className="w-full p-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none"
                                                    placeholder="Target"
                                                    value={newKR.target_value}
                                                    onChange={e => setNewKR({ ...newKR, target_value: e.target.value })}
                                                />
                                            </div>
                                            <button type="button" onClick={handleAddKR} className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                                <FaPlus />
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                            {newGoal.key_results && newGoal.key_results.map((kr, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-neutral-200 text-sm">
                                                    <span className="font-medium text-neutral-700">{kr.title}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-neutral-500 font-mono bg-neutral-50 px-2 py-0.5 rounded">Target: {kr.target_value}</span>
                                                        <button type="button" onClick={() => handleRemoveKR(idx)} className="text-neutral-400 hover:text-red-500 transition-colors">
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowGoalModal(false)}
                                        className="btn btn-ghost"
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
                )
            }
            {/* AI Performance Appraisal Summary Modal */}
            <AIModal
                isOpen={showAiPerfModal}
                onClose={() => setShowAiPerfModal(false)}
                title="AI Employee Performance Appraisal Summary"
                subtitle={`Performance analysis for ${activePerfReview?.employee_name || 'Employee'}`}
                loading={aiPerfLoading}
                loadingText="Synthesizing attendance, task velocity, and review history..."
                error={aiPerfError}
                onRetry={() => activePerfReview && handleGenerateAiPerformanceReview(activePerfReview)}
            >
                {aiPerfResult && (
                    <div className="space-y-4 text-xs">
                        {/* Rating Header */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">AI Evaluated Rating</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                        {aiPerfResult.rating} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                        {aiPerfResult.rating_label || 'Evaluated'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] text-slate-400 block">Designation</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{aiPerfResult.position || 'Staff'}</span>
                            </div>
                        </div>

                        {/* Executive Summary */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Executive Summary:</span>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{aiPerfResult.executive_summary}</p>
                        </div>

                        {/* Achievements & Areas for Improvement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
                                    <FaCheckSquare className="text-emerald-600" /> Key Accomplishments
                                </span>
                                <ul className="space-y-1 pl-4 list-disc text-emerald-900 dark:text-emerald-200">
                                    {Array.isArray(aiPerfResult.key_achievements) && aiPerfResult.key_achievements.map((a, i) => (
                                        <li key={i}>{a}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                                    <FiTrendingUp className="text-amber-600" /> Developmental Areas
                                </span>
                                <ul className="space-y-1 pl-4 list-disc text-amber-900 dark:text-amber-200">
                                    {Array.isArray(aiPerfResult.development_areas) && aiPerfResult.development_areas.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Action Plan */}
                        {aiPerfResult.action_plan && (
                            <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-1.5">
                                    <FiTarget className="text-indigo-600" /> Recommended Action Plan & Growth Steps
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{aiPerfResult.action_plan}</p>
                            </div>
                        )}
                    </div>
                )}
            </AIModal>
        </div >
    );
};

export default Performance;