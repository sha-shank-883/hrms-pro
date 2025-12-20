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
        <div className="w-full pb-8">
            {showWelcomeHero ? (
                <WelcomeHero stats={stats} />
            ) : (
                <>
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">{title}</h1>
                            <p className="mt-1 text-neutral-600">{description}</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <div className={`p-3 rounded-lg ${isOffboarding ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {isOffboarding ? <FaUserMinus size={20} /> : <FaUserPlus size={20} />}
                                </div>
                                <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                                    {user.role === 'employee' ? 'My Status' : (isOffboarding ? 'Exiting Employees' : 'Active Onboarding')}
                                </span>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-bold text-neutral-900 leading-none">
                                    {stats.total}
                                </h3>
                                <span className="text-sm text-neutral-500 mb-1">
                                    {user.role === 'employee' ? 'active' : 'employees'}
                                </span>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                                    <FaTasks size={20} />
                                </div>
                                <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Pending Tasks</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-bold text-neutral-900 leading-none">
                                    {stats.pendingTasks}
                                </h3>
                                <span className="text-sm text-neutral-500 mb-1">tasks remaining</span>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                                    <FaCheckCircle size={20} />
                                </div>
                                <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Completed</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-bold text-neutral-900 leading-none">
                                    {stats.completedTasks}
                                </h3>
                                <span className="text-sm text-neutral-500 mb-1">tasks done</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-4 gap-8">

                {/* Left Column: Task List */}
                <div className="lg:col-span-2">
                    <div class="card">
                        <div class="p-4 border-b border-neutral-100">
                            <h3 class="font-semibold text-neutral-800">{isOffboarding ? 'Offboarding Checklist' : 'Onboarding Checklist'}</h3>
                        </div>

                        <div className="space-y-4">
                            {myTasks.length > 0 ? (
                                myTasks.map(task => (
                                    <div key={task.task_id} className={`p-4 rounded-lg border transition-all ${task.status === 'completed'
                                            ? 'bg-neutral-50 border-neutral-100'
                                            : 'bg-white border-neutral-200 hover:border-primary-200 hover:shadow-sm'
                                        } flex items-center gap-4`}>
                                        <div
                                            onClick={() => handleTaskStatusUpdate(task.task_id, task.status === 'completed' ? 'in_progress' : 'completed')}
                                            className={`cursor-pointer text-2xl transition-colors ${task.status === 'completed' ? 'text-emerald-500' : 'text-neutral-300 hover:text-primary-500'
                                                }`}
                                        >
                                            <FaCheckCircle />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-semibold ${task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-800'
                                                }`}>
                                                {task.title}
                                            </h4>
                                            <p className="text-sm text-neutral-500 mt-0.5">{task.description}</p>
                                        </div>
                                        <span className={`badge badge-${task.priority === 'urgent' ? 'danger' :
                                                task.priority === 'high' ? 'warning' :
                                                    'secondary'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex p-4 rounded-full bg-neutral-50 text-neutral-300 mb-3">
                                        <FaClipboardList size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-neutral-700">All caught up!</h3>
                                    <p className="text-neutral-500 text-sm">You have no pending {mode} tasks.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: New Hires (Admin) or Resources (Employee) */}
                <div>
                    {(user.role === 'admin' || user.role === 'manager') ? (
                        <div className="card">
                            <div className="p-4 border-b border-neutral-100">
                                <h3 className="font-semibold text-neutral-800">
                                    {isOffboarding ? 'Recent Exits' : 'Recent Hires'}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {newHires.map(emp => (
                                    <div key={emp.employee_id} className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isOffboarding ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {emp.first_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-neutral-900 truncate">{emp.first_name} {emp.last_name}</div>
                                            <div className="text-xs text-neutral-500 truncate">{emp.position}</div>
                                        </div>
                                        <button className="text-neutral-400 hover:text-primary-600 transition-colors">
                                            <FaChevronRight size={14} />
                                        </button>
                                    </div>
                                ))}
                                {newHires.length === 0 && (
                                    <p className="text-center text-neutral-500 py-4 text-sm">
                                        {isOffboarding ? 'No exiting employees found.' : 'No recent hires found.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="p-4 border-b border-neutral-100">
                                <h3 className="font-semibold text-neutral-800">Quick Resources</h3>
                            </div>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="flex items-center gap-3 p-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-primary-600 transition-all font-medium text-sm group">
                                        <FaBriefcase className="text-neutral-400 group-hover:text-primary-500" />
                                        <span>{isOffboarding ? 'Exit Policy' : 'Employee Handbook'}</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center gap-3 p-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-primary-600 transition-all font-medium text-sm group">
                                        <FaUserTie className="text-neutral-400 group-hover:text-primary-500" />
                                        <span>{isOffboarding ? 'Asset Return Guide' : 'IT Policy'}</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center gap-3 p-2.5 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-primary-600 transition-all font-medium text-sm group">
                                        <FaClock className="text-neutral-400 group-hover:text-primary-500" />
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
