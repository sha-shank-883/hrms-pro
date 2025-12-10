import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService, employeeService } from '../services';
import { useLocation } from 'react-router-dom';
import WelcomeHero from '../components/WelcomeHero';
import {
    FaUserPlus,
    FaUserMinus,
    FaTasks,
    FaCheckCircle,
    FaClock,
    FaUserTie,
    FaBriefcase,
    FaClipboardList,
    FaChevronRight
} from 'react-icons/fa';

const Onboarding = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [mode, setMode] = useState('onboarding'); // 'onboarding' or 'offboarding'
    const [newHires, setNewHires] = useState([]); // Or exiting employees
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pendingTasks: 0,
        completedTasks: 0
    });

    useEffect(() => {
        // Determine mode based on path
        if (location.pathname.includes('offboarding')) {
            setMode('offboarding');
        } else {
            setMode('onboarding');
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchData();
    }, [user, mode]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch tasks assigned to me (or created by me if admin)
            const tasksRes = await taskService.getAll({ category: mode });
            setMyTasks(tasksRes.data);

            if (user.role === 'admin' || user.role === 'manager') {
                const employeesRes = await employeeService.getAll({ limit: 1000 });

                let relevantEmployees = [];
                if (mode === 'onboarding') {
                    // Fetch new hires (employees created in last 30 days)
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    relevantEmployees = employeesRes.data.filter(emp =>
                        new Date(emp.created_at) > thirtyDaysAgo
                    );
                } else {
                    // Fetch exiting employees (status is not active)
                    relevantEmployees = employeesRes.data.filter(emp =>
                        emp.status === 'notice_period' || emp.status === 'terminated' || emp.status === 'resigned'
                    );
                }

                setNewHires(relevantEmployees);

                setStats({
                    total: relevantEmployees.length,
                    pendingTasks: tasksRes.data.filter(t => t.status !== 'completed').length,
                    completedTasks: tasksRes.data.filter(t => t.status === 'completed').length
                });
            } else {
                // Employee stats
                setStats({
                    total: 1, // Self
                    pendingTasks: tasksRes.data.filter(t => t.status !== 'completed').length,
                    completedTasks: tasksRes.data.filter(t => t.status === 'completed').length
                });
            }

        } catch (error) {
            console.error(`Error fetching ${mode} data:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskStatusUpdate = async (taskId, newStatus) => {
        try {
            await taskService.update(taskId, {
                status: newStatus,
                progress: newStatus === 'completed' ? 100 : 50
            });
            fetchData();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    const isOffboarding = mode === 'offboarding';
    const showWelcomeHero = user.role === 'employee' && !isOffboarding;

    const title = isOffboarding ? 'Offboarding Center' : 'Onboarding Center';
    const description = user.role === 'employee'
        ? (isOffboarding ? 'Complete these tasks before your last day.' : 'Welcome aboard! Here is your checklist to get started.')
        : (isOffboarding ? 'Manage exiting employees and exit workflows.' : 'Manage new hires and onboarding workflows.');

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>

            {showWelcomeHero ? (
                <WelcomeHero stats={stats} />
            ) : (
                <>
                    {/* Header */}
                    <div className="page-header" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                        <h1 className="page-title">{title}</h1>
                        <p className="page-description">{description}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: isOffboarding ? '#fee2e2' : '#e0e7ff', padding: '0.75rem', borderRadius: '0.5rem', color: isOffboarding ? '#dc2626' : '#4f46e5' }}>
                                    {isOffboarding ? <FaUserMinus size={20} /> : <FaUserPlus size={20} />}
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>
                                    {user.role === 'employee' ? 'My Status' : (isOffboarding ? 'Exiting Employees' : 'Active Onboarding')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>
                                    {stats.total}
                                </h3>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    {user.role === 'employee' ? 'active' : 'employees'}
                                </span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '0.5rem', color: '#d97706' }}>
                                    <FaTasks size={20} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Pending Tasks</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>
                                    {stats.pendingTasks}
                                </h3>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>tasks remaining</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '0.5rem', color: '#059669' }}>
                                    <FaCheckCircle size={20} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Completed</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>
                                    {stats.completedTasks}
                                </h3>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>tasks done</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '2rem' }}>

                {/* Left Column: Task List */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>{isOffboarding ? 'Offboarding Checklist' : 'Onboarding Checklist'}</h3>
                            {/* Admin controls could go here */}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {myTasks.length > 0 ? (
                                myTasks.map(task => (
                                    <div key={task.task_id} style={{
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        background: task.status === 'completed' ? '#f9fafb' : 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div
                                            onClick={() => handleTaskStatusUpdate(task.task_id, task.status === 'completed' ? 'in_progress' : 'completed')}
                                            style={{
                                                cursor: 'pointer',
                                                color: task.status === 'completed' ? '#059669' : '#d1d5db',
                                                fontSize: '1.5rem'
                                            }}
                                        >
                                            <FaCheckCircle />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{
                                                fontWeight: '600',
                                                color: task.status === 'completed' ? '#9ca3af' : '#111827',
                                                textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                            }}>
                                                {task.title}
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{task.description}</p>
                                        </div>
                                        <div className={`badge ${task.priority === 'urgent' ? 'badge-error' :
                                            task.priority === 'high' ? 'badge-warning' :
                                                'badge-info'
                                            }`}>
                                            {task.priority}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <FaClipboardList />
                                    </div>
                                    <h3 className="empty-state-title">All caught up!</h3>
                                    <p className="empty-state-description">You have no pending {mode} tasks.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: New Hires (Admin) or Resources (Employee) */}
                <div>
                    {(user.role === 'admin' || user.role === 'manager') ? (
                        <div className="card">
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
                                {isOffboarding ? 'Recent Exits' : 'Recent Hires'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {newHires.map(emp => (
                                    <div key={emp.employee_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                            background: isOffboarding ? '#fee2e2' : '#e0e7ff',
                                            color: isOffboarding ? '#dc2626' : '#4f46e5',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}>
                                            {emp.first_name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#111827' }}>{emp.first_name} {emp.last_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{emp.position}</div>
                                        </div>
                                        <button className="btn-icon" title="View Details">
                                            <FaChevronRight />
                                        </button>
                                    </div>
                                ))}
                                {newHires.length === 0 && (
                                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                                        {isOffboarding ? 'No exiting employees found.' : 'No recent hires found.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>Quick Resources</h3>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <li>
                                    <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563', textDecoration: 'none', padding: '0.5rem', borderRadius: '0.375rem', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                        <FaBriefcase style={{ color: '#9ca3af' }} />
                                        <span>{isOffboarding ? 'Exit Policy' : 'Employee Handbook'}</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563', textDecoration: 'none', padding: '0.5rem', borderRadius: '0.375rem', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                        <FaUserTie style={{ color: '#9ca3af' }} />
                                        <span>{isOffboarding ? 'Asset Return Guide' : 'IT Policy'}</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563', textDecoration: 'none', padding: '0.5rem', borderRadius: '0.375rem', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                        <FaClock style={{ color: '#9ca3af' }} />
                                        <span>{isOffboarding ? 'Final Settlement' : 'Holiday Calendar'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
