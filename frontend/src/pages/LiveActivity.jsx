import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBolt, FaFilter, FaSearch, FaCheck, FaTimes, FaClock,
    FaCalendarCheck, FaTasks, FaInfoCircle, FaUserClock, FaSync,
    FaExclamationCircle, FaChartLine, FaArrowRight, FaEllipsisV
} from 'react-icons/fa';
import { leaveService, taskService, attendanceService } from '../services';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import '../styles/LiveActivity.css';

const LiveActivity = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { markAsRead } = useNotifications();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, leaves, tasks, attendance
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed
    const [dateFilter, setDateFilter] = useState('all'); // all, today, week
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchActivities();
        markAsRead('liveActivity');
    }, [markAsRead]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const [leavesRes, tasksRes, attendanceRes] = await Promise.allSettled([
                leaveService.getAll({ limit: 50 }),
                taskService.getAll({ limit: 50 }),
                attendanceService.getAll({ limit: 50 })
            ]);

            let combined = [];

            if (leavesRes.status === 'fulfilled') {
                const data = leavesRes.value.data || [];
                combined.push(...data.map(l => ({
                    id: `leave-${l.leave_id}`,
                    rawId: l.leave_id,
                    type: 'LEAVE',
                    title: l.employee_name || `Employee #${l.employee_id}`,
                    subtitle: `${l.leave_type} Request`,
                    description: l.reason,
                    time: l.created_at,
                    status: l.status,
                    priority: l.status === 'pending' ? 'high' : 'medium',
                    data: l
                })));
            }

            if (tasksRes.status === 'fulfilled') {
                const data = tasksRes.value.data || [];
                combined.push(...data.map(t => ({
                    id: `task-${t.task_id}`,
                    rawId: t.task_id,
                    type: 'TASK',
                    title: t.title,
                    subtitle: 'Task Created',
                    description: t.description,
                    time: t.created_at,
                    status: t.status,
                    priority: t.priority || 'medium',
                    data: t
                })));
            }

            if (attendanceRes.status === 'fulfilled') {
                const data = attendanceRes.value.data || [];
                combined.push(...data.map(a => ({
                    id: `att-${a.attendance_id}`,
                    rawId: a.attendance_id,
                    type: 'ATTENDANCE',
                    title: a.employee_name || `Employee #${a.employee_id}`,
                    subtitle: a.clock_out ? 'Clocked Out' : 'Clocked In',
                    description: a.clock_out ? `Worked: ${a.work_hours || 0}h` : `Clocked in at ${a.clock_in}`,
                    time: a.date,
                    status: 'info',
                    priority: 'low',
                    data: a
                })));
            }

            combined.sort((a, b) => new Date(b.time) - new Date(a.time));
            setActivities(combined);
        } catch (error) {
            console.error("Failed to fetch activities", error);
        } finally {
            setLoading(false);
        }
    };

    // Socket listener for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notif) => {
            const data = notif.data;
            let newItem = null;

            switch (notif.type) {
                case 'LEAVE_APPLICATION':
                    newItem = {
                        id: `leave-${data.leave_id}`,
                        rawId: data.leave_id,
                        type: 'LEAVE',
                        title: data.employee_name || 'New Leave Request',
                        subtitle: `${data.leave_type} Request`,
                        description: notif.message,
                        time: new Date().toISOString(),
                        status: 'pending',
                        priority: 'high',
                        isNew: true,
                        data: data
                    };
                    break;
                case 'TASK_ASSIGNED':
                    newItem = {
                        id: `task-${data.task_id}`,
                        rawId: data.task_id,
                        type: 'TASK',
                        title: data.title || 'New Task',
                        subtitle: 'Task Assigned',
                        description: notif.message,
                        time: new Date().toISOString(),
                        status: data.status || 'todo',
                        priority: data.priority || 'medium',
                        isNew: true,
                        data: data
                    };
                    break;
                case 'TASK_UPDATE':
                    newItem = {
                        id: `task-upd-${data.task_id}-${Date.now()}`,
                        rawId: data.task_id,
                        type: 'TASK_UPDATE',
                        title: 'Task Update',
                        subtitle: `Task #${data.task_id}`,
                        description: notif.message,
                        time: new Date().toISOString(),
                        status: 'info',
                        priority: 'medium',
                        isNew: true,
                        data: data
                    };
                    break;
                case 'ATTENDANCE_LOG':
                    newItem = {
                        id: `att-${data.attendance_id}-${Date.now()}`,
                        rawId: data.attendance_id,
                        type: 'ATTENDANCE',
                        title: 'Attendance Alert',
                        subtitle: data.clock_out ? 'Clock Out' : 'Clock In',
                        description: notif.message,
                        time: new Date().toISOString(),
                        status: 'info',
                        priority: 'low',
                        isNew: true,
                        data: data
                    };
                    break;
                default:
                    return;
            }

            if (newItem) {
                setActivities(prev => [newItem, ...prev]);
            }
        };

        socket.on('notification', handleNotification);
        return () => socket.off('notification', handleNotification);
    }, [socket]);

    // Handle Leave Actions
    const handleLeaveAction = async (id, status) => {
        setProcessingId(`leave-${id}`);
        try {
            await leaveService.updateStatus(id, status);
            // Update local state
            setActivities(prev => prev.map(item => {
                if (item.type === 'LEAVE' && item.rawId === id) {
                    return { ...item, status: status, description: `${status} by ${user.first_name}` };
                }
                return item;
            }));
        } catch (error) {
            console.error(`Failed to ${status} leave`, error);
            alert(`Failed to ${status} leave`);
        } finally {
            setProcessingId(null);
        }
    };

    // Filter Logic
    const filteredActivities = useMemo(() => {
        return activities.filter(item => {
            // Type filter
            if (filter !== 'all' && item.type !== filter && !(filter === 'TASK' && item.type === 'TASK_UPDATE')) return false;

            // Status filter
            if (statusFilter === 'pending') {
                if (!['pending', 'todo', 'in_progress'].includes(item.status)) return false;
            } else if (statusFilter === 'completed') {
                if (!['approved', 'completed', 'rejected'].includes(item.status)) return false;
            }

            // Date filter
            if (dateFilter !== 'all') {
                const itemDate = new Date(item.time);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dateFilter === 'today') {
                    if (itemDate < today) return false;
                } else if (dateFilter === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    if (itemDate < weekAgo) return false;
                }
            }

            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    item.title.toLowerCase().includes(searchLower) ||
                    item.description.toLowerCase().includes(searchLower) ||
                    item.subtitle.toLowerCase().includes(searchLower)
                );
            }
            return true;
        });
    }, [activities, filter, statusFilter, dateFilter, searchTerm]);

    // Stats Calculation
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return {
            pendingLeaves: activities.filter(a => a.type === 'LEAVE' && a.status === 'pending').length,
            activeTasks: activities.filter(a => a.type === 'TASK' && ['todo', 'in_progress'].includes(a.status)).length,
            todayClockIns: activities.filter(a => a.type === 'ATTENDANCE' && a.time.startsWith(todayStr) && !a.data.clock_out).length,
            urgentAlerts: activities.filter(a => a.priority === 'high' && !['approved', 'completed', 'rejected'].includes(a.status)).length
        };
    }, [activities]);

    const handleViewDetails = (item) => {
        switch (item.type) {
            case 'LEAVE':
                navigate('/leaves');
                break;
            case 'TASK':
            case 'TASK_UPDATE':
                navigate('/tasks');
                break;
            case 'ATTENDANCE':
                navigate('/attendance');
                break;
            default:
                break;
        }
    };

    const getIconClass = (type) => {
        switch (type) {
            case 'LEAVE': return 'icon-leave';
            case 'TASK': return 'icon-task';
            case 'TASK_UPDATE': return 'icon-update';
            case 'ATTENDANCE': return 'icon-attendance';
            default: return 'icon-default';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'LEAVE': return <FaCalendarCheck />;
            case 'TASK': return <FaTasks />;
            case 'TASK_UPDATE': return <FaInfoCircle />;
            case 'ATTENDANCE': return <FaUserClock />;
            default: return <FaBolt />;
        }
    };

    const getStatusClass = (status) => {
        if (['approved', 'completed', 'present'].includes(status)) return 'status-green';
        if (['rejected', 'cancelled', 'absent'].includes(status)) return 'status-red';
        if (['pending', 'todo', 'in_progress'].includes(status)) return 'status-amber';
        return 'status-gray';
    };

    return (
        <div className="live-activity-container">
            <div className="live-activity-header">
                <div className="header-title">
                    <div className="flex items-center gap-3">
                        <div className="title-icon">
                            <FaBolt className="text-white" />
                        </div>
                        <div>
                            <h1>Live Activity Feed</h1>
                            <p>Real-time monitoring and management of organization events</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchActivities}
                        className="btn btn-secondary flex items-center gap-2"
                        title="Refresh Feed"
                    >
                        <FaSync className={loading ? 'spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Top Insights Bar */}
            <div className="insights-grid">
                <div className="insight-card">
                    <div className="insight-icon bg-amber-100 text-amber-600">
                        <FaCalendarCheck size={20} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Pending Leaves</span>
                        <span className="insight-value">{stats.pendingLeaves}</span>
                    </div>
                </div>
                <div className="insight-card">
                    <div className="insight-icon bg-blue-100 text-blue-600">
                        <FaTasks size={20} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Active Tasks</span>
                        <span className="insight-value">{stats.activeTasks}</span>
                    </div>
                </div>
                <div className="insight-card">
                    <div className="insight-icon bg-emerald-100 text-emerald-600">
                        <FaUserClock size={20} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Clock-ins Today</span>
                        <span className="insight-value">{stats.todayClockIns}</span>
                    </div>
                </div>
                <div className="insight-card urgent">
                    <div className="insight-icon bg-red-100 text-red-600">
                        <FaExclamationCircle size={20} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Urgent Alerts</span>
                        <span className="insight-value">{stats.urgentAlerts}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="live-activity-layout">
                {/* Left Column: Feed */}
                <div className="activity-feed-section">
                    <div className="activity-filters-card">
                        <div className="filter-group">
                            <div className="filter-buttons">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`filter-btn all ${filter === 'all' ? 'active' : ''}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('LEAVE')}
                                    className={`filter-btn leave ${filter === 'LEAVE' ? 'active' : ''}`}
                                >
                                    Leaves
                                </button>
                                <button
                                    onClick={() => setFilter('TASK')}
                                    className={`filter-btn task ${filter === 'TASK' ? 'active' : ''}`}
                                >
                                    Tasks
                                </button>
                                <button
                                    onClick={() => setFilter('ATTENDANCE')}
                                    className={`filter-btn attendance ${filter === 'ATTENDANCE' ? 'active' : ''}`}
                                >
                                    Attendance
                                </button>
                            </div>
                            <div className="dropdown-group">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="status-dropdown"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending/Active</option>
                                    <option value="completed">Completed/Historical</option>
                                </select>
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="status-dropdown"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">Past 7 Days</option>
                                </select>
                            </div>
                        </div>

                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search activity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="activity-feed">
                        {loading && activities.length === 0 ? (
                            <div className="loading-state">
                                <div className="spinner-glow"></div>
                                <p>Syncing Live Activity...</p>
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaFilter size={32} />
                                </div>
                                <p className="text-lg font-semibold">No matches found</p>
                                <p className="text-sm opacity-60">Try adjusting your filters or search term</p>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {filteredActivities.map((item) => (
                                    <div key={item.id} className={`activity-item ${item.isNew ? 'is-new' : ''}`}>
                                        <div className="activity-content-wrapper">
                                            {/* Icon Column */}
                                            <div className="activity-indicator-side">
                                                <div className={`activity-icon ${getIconClass(item.type)}`}>
                                                    {getIcon(item.type)}
                                                </div>
                                                <div className="activity-line"></div>
                                            </div>

                                            {/* Content Column */}
                                            <div className="activity-details">
                                                <div className="activity-top-row">
                                                    <div className="activity-title">
                                                        <div className="flex items-center gap-2">
                                                            <h3>{item.title}</h3>
                                                            {item.isNew && <span className="new-badge">NEW</span>}
                                                            {item.priority === 'high' && <span className="urgent-badge">URGENT</span>}
                                                        </div>
                                                        <p className="activity-subtitle">{item.subtitle}</p>
                                                    </div>
                                                    <span className="activity-time">
                                                        <FaClock size={10} />
                                                        {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        <span className="date-sep">•</span>
                                                        {new Date(item.time).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className="activity-description">
                                                    {item.description}
                                                </div>

                                                {/* Action Bar */}
                                                <div className="activity-action-bar">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`status-badge ${getStatusClass(item.status)}`}>
                                                            {item.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="user-indicator">
                                                            <div className="short-name">{item.title.charAt(0)}</div>
                                                        </span>
                                                    </div>

                                                    {/* Management Actions */}
                                                    <div className="action-buttons">
                                                        {item.type === 'LEAVE' && item.status === 'pending' && user.role !== 'employee' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleLeaveAction(item.rawId, 'approved')}
                                                                    disabled={processingId === item.id}
                                                                    className="btn-action approve"
                                                                    title="Approve Request"
                                                                >
                                                                    {processingId === item.id ? <span className="mini-spin"></span> : <FaCheck />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleLeaveAction(item.rawId, 'rejected')}
                                                                    disabled={processingId === item.id}
                                                                    className="btn-action reject"
                                                                    title="Reject Request"
                                                                >
                                                                    {processingId === item.id ? <span className="mini-spin"></span> : <FaTimes />}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleViewDetails(item)}
                                                                className="btn-details"
                                                                title="View Details"
                                                            >
                                                                <FaArrowRight />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Insights/Sidebar */}
                <div className="activity-sidebar">
                    <div className="sidebar-card">
                        <div className="card-top">
                            <h4>Activity Trends</h4>
                            <FaChartLine className="text-primary-500" />
                        </div>
                        <div className="trend-stats">
                            <div className="trend-item">
                                <div className="trend-bar-bg">
                                    <div className="trend-bar fill-leave" style={{ width: '65%' }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 font-bold">
                                    <span>LEAVES</span>
                                    <span>65%</span>
                                </div>
                            </div>
                            <div className="trend-item">
                                <div className="trend-bar-bg">
                                    <div className="trend-bar fill-task" style={{ width: '45%' }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 font-bold">
                                    <span>TASKS</span>
                                    <span>45%</span>
                                </div>
                            </div>
                            <div className="trend-item">
                                <div className="trend-bar-bg">
                                    <div className="trend-bar fill-attendance" style={{ width: '80%' }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 font-bold">
                                    <span>ATTENDANCE</span>
                                    <span>80%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-card info-tip">
                        <div className="flex gap-3">
                            <FaInfoCircle className="text-blue-500 shrink-0 mt-1" />
                            <div>
                                <h5 className="font-bold text-sm">Quick Tip</h5>
                                <p className="text-xs text-neutral-500 mt-1">
                                    You can instantly approve/reject leaves directly from this feed by clicking the check or cross buttons.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-card recent-employees">
                        <h4 className="mb-4">Recent Actors</h4>
                        <div className="employee-pile">
                            {Array.from(new Set(activities.map(a => a.title))).slice(0, 5).map((name, i) => (
                                <div key={i} className="actor-item">
                                    <div className="actor-avatar">{name.charAt(0)}</div>
                                    <div className="actor-info">
                                        <span className="actor-name">{name}</span>
                                        <span className="actor-role">Employee</span>
                                    </div>
                                    <FaEllipsisV className="text-neutral-300 ml-auto" size={10} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveActivity;
