import React, { useState, useEffect } from 'react';
import {
    FaBolt, FaFilter, FaSearch, FaCheck, FaTimes, FaClock,
    FaCalendarCheck, FaTasks, FaInfoCircle, FaUserClock, FaSync
} from 'react-icons/fa';
import { leaveService, taskService, attendanceService } from '../services';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import '../styles/LiveActivity.css';

const LiveActivity = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, leaves, tasks, attendance
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchActivities();
    }, []);

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
                        data: data
                    };
                    break;
                case 'TASK_UPDATE':
                    // Just add to top as a log, or update existing if we want
                    newItem = {
                        id: `task-upd-${data.task_id}-${Date.now()}`,
                        rawId: data.task_id,
                        type: 'TASK_UPDATE',
                        title: 'Task Update',
                        subtitle: `Task #${data.task_id}`,
                        description: notif.message,
                        time: new Date().toISOString(),
                        status: 'info',
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
    const filteredActivities = activities.filter(item => {
        if (filter !== 'all' && item.type !== filter && !(filter === 'TASK' && item.type === 'TASK_UPDATE')) return false;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                item.title.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

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
        if (['pending', 'todo'].includes(status)) return 'status-amber';
        return 'status-gray';
    };

    return (
        <div className="live-activity-container">
            <div className="live-activity-header">
                <div className="header-title">
                    <h1><FaBolt className="text-indigo-600" /> Live Activity Feed</h1>
                    <p>Real-time monitoring and management of organization events</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchActivities}
                        className="btn btn-secondary flex items-center gap-2"
                        title="Refresh Feed"
                    >
                        <FaSync className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="activity-filters-card">
                <div className="filter-buttons">
                    <button
                        onClick={() => setFilter('all')}
                        className={`filter-btn all ${filter === 'all' ? 'active' : ''}`}
                    >
                        All Activity
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

            {/* Main Feed */}
            <div className="activity-feed">
                {loading && activities.length === 0 ? (
                    <div className="loading-state">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full spin"></div>
                        <p>Loading activity feed...</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="empty-state">
                        <FaFilter size={48} style={{ opacity: 0.2 }} />
                        <p className="text-lg">No activities found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="activity-list">
                        {filteredActivities.map((item) => (
                            <div key={item.id} className="activity-item">
                                <div className="activity-content-wrapper">
                                    {/* Icon Column */}
                                    <div className={`activity-icon ${getIconClass(item.type)}`}>
                                        {getIcon(item.type)}
                                    </div>

                                    {/* Content Column */}
                                    <div className="activity-details">
                                        <div className="activity-top-row">
                                            <div className="activity-title">
                                                <h3>{item.title}</h3>
                                                <p className="activity-subtitle">{item.subtitle}</p>
                                            </div>
                                            <span className="activity-time">
                                                <FaClock />
                                                {new Date(item.time).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="activity-description">
                                            {item.description}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="activity-action-bar">
                                            {/* Status Badge */}
                                            <span className={`status-badge ${getStatusClass(item.status)}`}>
                                                {item.status}
                                            </span>

                                            {/* Management Actions */}
                                            {item.type === 'LEAVE' && item.status === 'pending' && user.role !== 'employee' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleLeaveAction(item.rawId, 'approved')}
                                                        disabled={processingId === item.id}
                                                        className="btn-approve"
                                                    >
                                                        {processingId === item.id ? <span className="spin">⟳</span> : <FaCheck />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleLeaveAction(item.rawId, 'rejected')}
                                                        disabled={processingId === item.id}
                                                        className="btn-reject"
                                                    >
                                                        {processingId === item.id ? <span className="spin">⟳</span> : <FaTimes />}
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveActivity;
