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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Column: Journey Timeline */}
                <div className="lg:col-span-3">
                    <div className="relative ml-4 pl-8 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-12 pb-12">
                        <div className="absolute top-0 -left-[2px] w-[2px] h-full bg-gradient-to-b from-primary-500 via-neutral-100 to-transparent"></div>

                        {myTasks.length > 0 ? (
                            myTasks.map((task, index) => (
                                <div key={task.task_id} className="relative">
                                    {/* Journey Node */}
                                    <div className={`absolute -left-[41px] top-4 w-5 h-5 rounded-full border-4 border-white shadow-md transition-all duration-300 ${task.status === 'completed'
                                            ? 'bg-emerald-500 scale-110 shadow-emerald-100'
                                            : 'bg-neutral-200'
                                        }`}>
                                        {task.status === 'completed' && <FaCheckCircle className="text-white absolute inset-0 m-auto" size={10} />}
                                    </div>

                                    {/* Task Card */}
                                    <div className={`card overflow-hidden transition-all duration-300 ${task.status === 'completed'
                                            ? 'bg-neutral-50/50 border-neutral-100 opacity-80'
                                            : 'hover:shadow-lg hover:-translate-y-1'
                                        }`}>
                                        <div className="card-body p-6">
                                            <div className="flex items-start gap-5">
                                                <div className={`p-4 rounded-2xl flex-shrink-0 transition-colors ${task.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : 'bg-indigo-50 text-indigo-600'
                                                    }`}>
                                                    <FaClipboardList size={24} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className={`text-xl font-bold transition-all ${task.status === 'completed'
                                                                        ? 'text-neutral-400 line-through'
                                                                        : 'text-neutral-900'
                                                                    }`}>
                                                                    {task.title}
                                                                </h4>
                                                                <span className={`badge badge-${task.priority === 'urgent' ? 'danger' :
                                                                        task.priority === 'high' ? 'warning' : 'secondary'
                                                                    }`}>
                                                                    {task.priority}
                                                                </span>
                                                            </div>
                                                            <p className={`text-neutral-600 leading-relaxed max-w-3xl ${task.status === 'completed' ? 'text-neutral-400' : ''
                                                                }`}>
                                                                {task.description}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center self-end md:self-start">
                                                            <button
                                                                onClick={() => handleTaskStatusUpdate(task.task_id, task.status === 'completed' ? 'in_progress' : 'completed')}
                                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${task.status === 'completed'
                                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-100 hover:shadow-primary-200'
                                                                    }`}
                                                            >
                                                                {task.status === 'completed' ? (
                                                                    <><FaCheckCircle /> Completed</>
                                                                ) : (
                                                                    'Complete Step'
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 pt-5 border-t border-dashed border-neutral-100 flex flex-wrap items-center gap-6 text-sm text-neutral-500">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                                                <FaClock className="text-neutral-400" size={12} />
                                                            </div>
                                                            <span>
                                                                Due: <span className="font-medium text-neutral-700">
                                                                    {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div className="h-4 w-[1px] bg-neutral-200" />
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                                                <FaTasks className="text-neutral-400" size={12} />
                                                            </div>
                                                            <span>
                                                                Status: <span className={`font-medium ${task.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                                                                    }`}>
                                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                                <div className="inline-flex p-6 rounded-full bg-white shadow-sm text-neutral-300 mb-4">
                                    <FaClipboardList size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-800">Your journey is clear!</h3>
                                <p className="text-neutral-500 max-w-xs mx-auto mt-2">No tasks are currently assigned to your {mode} journey.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Insights & Resources */}
                <div className="space-y-6">
                    {/* Progress Circle (Only for Employee) */}
                    {user.role === 'employee' && (
                        <div className="card text-center p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-xl shadow-indigo-100">
                            <h3 className="text-lg font-bold mb-4">Your Progress</h3>
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="white"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={364.4}
                                        strokeDashoffset={364.4 - (364.4 * (stats.completedTasks / (stats.total_tasks || stats.pendingTasks + stats.completedTasks || 1)))}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black">
                                        {Math.round((stats.completedTasks / (stats.total_tasks || stats.pendingTasks + stats.completedTasks || 1)) * 100)}%
                                    </span>
                                </div>
                            </div>
                            <p className="text-indigo-100 text-sm font-medium">
                                {stats.pendingTasks} tasks remaining
                            </p>
                        </div>
                    )}

                    {/* People section (Admin) */}
                    {(user.role === 'admin' || user.role === 'manager') && (
                        <div className="card">
                            <div className="p-5 border-b border-neutral-100">
                                <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                                    <FaUserTie className="text-primary-500" />
                                    {isOffboarding ? 'Recent Exits' : 'Recent Hires'}
                                </h3>
                            </div>
                            <div className="p-2 space-y-1">
                                {newHires.map(emp => (
                                    <div key={emp.employee_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isOffboarding ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
                                                {emp.first_name} {emp.last_name}
                                            </div>
                                            <div className="text-xs text-neutral-500 truncate">{emp.position}</div>
                                        </div>
                                        <FaChevronRight className="text-neutral-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" size={12} />
                                    </div>
                                ))}
                                {newHires.length === 0 && (
                                    <p className="text-center text-neutral-400 py-8 text-sm italic">
                                        No recent {isOffboarding ? 'exits' : 'hires'} found
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Resources Hub */}
                    <div className="card">
                        <div className="p-5 border-b border-neutral-100">
                            <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                                <FaBriefcase className="text-primary-500" />
                                Resources Hub
                            </h3>
                        </div>
                        <div className="p-3 space-y-2">
                            <a href="#" className="flex items-center gap-4 p-3 rounded-xl text-neutral-600 hover:bg-primary-50 hover:text-primary-700 transition-all group border border-transparent hover:border-primary-100">
                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <FaClipboardList className="text-neutral-400 group-hover:text-primary-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">
                                        {isOffboarding ? 'Exit Guidelines' : 'Employee Handbook'}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Policy Document</div>
                                </div>
                            </a>
                            <a href="#" className="flex items-center gap-4 p-3 rounded-xl text-neutral-600 hover:bg-primary-50 hover:text-primary-700 transition-all group border border-transparent hover:border-primary-100">
                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <FaUserTie className="text-neutral-400 group-hover:text-primary-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">
                                        {isOffboarding ? 'Asset Recovery' : 'Work Culture Info'}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Getting Started</div>
                                </div>
                            </a>
                            <a href="#" className="flex items-center gap-4 p-3 rounded-xl text-neutral-600 hover:bg-primary-50 hover:text-primary-700 transition-all group border border-transparent hover:border-primary-100">
                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <FaClock className="text-neutral-400 group-hover:text-primary-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">
                                        {isOffboarding ? 'Final Settlement' : 'Company Benefits'}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Financials</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
