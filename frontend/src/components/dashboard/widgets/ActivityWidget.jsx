import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheckCircle, FaClock, FaTasks, FaCalendarCheck, FaInfoCircle, FaFilter, FaCog } from 'react-icons/fa';
import { useSocket } from '../../../context/SocketContext';
import { leaveService, taskService, attendanceService } from '../../../services';

const ActivityWidget = memo(({
    limit = 10,
    chartType = 'list',
    onToggle,
    onSettingsClick,
    isSettingsOpen
}) => {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, leaves, tasks, attendance

    // Initial fetch of recent activity
    useEffect(() => {
        const fetchActivity = async () => {
            try {
                setLoading(true);
                // Fetch recent data in parallel
                const [leavesRes, tasksRes, attendanceRes] = await Promise.allSettled([
                    leaveService.getAll({ limit: 10 }),
                    taskService.getAll({ limit: 10 }),
                    attendanceService.getAll({ limit: 10 })
                ]);

                let combined = [];

                // Process Leaves
                if (leavesRes.status === 'fulfilled') {
                    const data = leavesRes.value.data || [];
                    combined.push(...data.map(l => ({
                        id: `leave-${l.leave_id}`,
                        type: 'LEAVE_APPLICATION',
                        title: l.employee_name || `Employee #${l.employee_id}`,
                        subtitle: `${l.leave_type} Request`,
                        message: l.reason,
                        time: l.created_at,
                        status: l.status,
                        icon: <FaCalendarCheck />,
                        color: 'bg-amber-100 text-amber-600'
                    })));
                }

                // Process Tasks
                if (tasksRes.status === 'fulfilled') {
                    const data = tasksRes.value.data || [];
                    combined.push(...data.map(t => ({
                        id: `task-${t.task_id}`,
                        type: 'TASK_ASSIGNED',
                        title: t.title,
                        subtitle: 'Task Created',
                        message: t.description,
                        time: t.created_at,
                        status: t.status,
                        icon: <FaTasks />,
                        color: 'bg-blue-100 text-blue-600'
                    })));
                }

                // Process Attendance
                if (attendanceRes.status === 'fulfilled') {
                    const data = attendanceRes.value.data || [];
                    combined.push(...data.map(a => ({
                        id: `att-${a.attendance_id}`,
                        type: 'ATTENDANCE_LOG',
                        title: a.employee_name || `Employee #${a.employee_id}`,
                        subtitle: a.clock_out ? 'Clocked Out' : 'Clocked In',
                        message: a.clock_out ? `Worked: ${a.work_hours || 0}h` : `Time: ${a.clock_in}`,
                        time: a.date,
                        status: 'info',
                        icon: <FaClock />,
                        color: 'bg-emerald-100 text-emerald-600'
                    })));
                }

                // Sort by time descending
                combined.sort((a, b) => new Date(b.time) - new Date(a.time));
                setNotifications(combined.slice(0, limit));

            } catch (error) {
                console.error("Failed to fetch activity feed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [limit]);

    // Socket listener
    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notif) => {
            let newItem = null;
            const data = notif.data;

            switch (notif.type) {
                case 'LEAVE_APPLICATION':
                    newItem = {
                        id: `leave-${data.leave_id}`,
                        type: 'LEAVE_APPLICATION',
                        title: data.employee_name || 'New Leave Request',
                        subtitle: `${data.leave_type} Request`,
                        message: notif.message,
                        time: new Date().toISOString(),
                        icon: <FaCalendarCheck />,
                        color: 'bg-amber-100 text-amber-600'
                    };
                    break;
                case 'TASK_ASSIGNED':
                    newItem = {
                        id: `task-${data.task_id}`,
                        type: 'TASK_ASSIGNED',
                        title: 'New Task',
                        subtitle: data.title,
                        message: notif.message,
                        time: new Date().toISOString(),
                        icon: <FaTasks />,
                        color: 'bg-blue-100 text-blue-600'
                    };
                    break;
                case 'TASK_UPDATE':
                    newItem = {
                        id: `task-update-${data.task_id}-${Date.now()}`,
                        type: 'TASK_UPDATE',
                        title: 'Task Update',
                        subtitle: `Task #${data.task_id}`,
                        message: notif.message,
                        time: new Date().toISOString(),
                        icon: <FaInfoCircle />,
                        color: 'bg-indigo-100 text-indigo-600'
                    };
                    break;
                case 'ATTENDANCE_LOG':
                    newItem = {
                        id: `att-${data.attendance_id}-${Date.now()}`,
                        type: 'ATTENDANCE_LOG',
                        title: 'Attendance Alert',
                        subtitle: data.clock_out ? 'Clock Out' : 'Clock In',
                        message: notif.message,
                        time: new Date().toISOString(),
                        icon: <FaClock />,
                        color: 'bg-emerald-100 text-emerald-600'
                    };
                    break;
                default:
                    return;
            }

            if (newItem) {
                setNotifications(prev => [newItem, ...prev].slice(0, limit));
            }
        };

        socket.on('notification', handleNotification);
        return () => socket.off('notification', handleNotification);
    }, [socket, limit]);

    // Filter Logic
    const filteredNotifications = notifications.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'leaves' && item.type === 'LEAVE_APPLICATION') return true;
        if (filter === 'tasks' && (item.type === 'TASK_ASSIGNED' || item.type === 'TASK_UPDATE')) return true;
        if (filter === 'attendance' && item.type === 'ATTENDANCE_LOG') return true;
        return false;
    });

    // Format time helper
    const getTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="card-header flex justify-between items-center py-3 px-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-600">
                        <FaBell size={14} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm m-0">Live Activity</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Real-time system updates</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onSettingsClick}
                        className={`btn-icon-only ${isSettingsOpen ? 'active' : ''}`}
                        aria-label="Widget settings"
                    >
                        <FaCog size={12} />
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="px-4 py-3 border-b border-gray-200 flex gap-2 flex-wrap bg-gray-50">
                <button
                    onClick={() => setFilter('all')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('leaves')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'leaves' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                    Leaves
                </button>
                <button
                    onClick={() => setFilter('tasks')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'tasks' ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                    Tasks
                </button>
                <button
                    onClick={() => setFilter('attendance')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'attendance' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                    Attendance
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-200">
                {loading ? (
                    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg m-4">
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }}></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-gray-50 rounded-lg m-4">
                        <FaCheckCircle className="mb-3 text-success" size={36} />
                        <p className="text-sm font-medium text-gray-600">No recent activity</p>
                        {filter !== 'all' && <p className="text-xs mt-1 text-gray-500">Try selecting "All" filter</p>}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredNotifications.map((req) => (
                            <div key={req.id} className="px-4 py-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors last:border-0 group flex items-center justify-between min-h-[48px]">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`notification-icon ${req.color}`}>
                                        {req.icon}
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0 text-xs overflow-hidden">
                                        <span className="font-semibold text-neutral-900 truncate shrink-0">{req.title}</span>
                                        <span className="text-neutral-500 truncate shrink-0">· {req.subtitle}</span>
                                        {req.message && (
                                            <span className="text-neutral-500 truncate italic opacity-80 border-l border-neutral-200 pl-1.5 ml-0.5">
                                                {req.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] text-neutral-400 whitespace-nowrap ml-3 shrink-0 italic">
                                    {getTimeAgo(req.time)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                <button
                    onClick={() => navigate('/live-activity')}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer bg-transparent border-0 transition-colors"
                >
                    View All Activity →
                </button>
            </div>
        </div>
    );
});

export default ActivityWidget;