import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheckCircle, FaClock, FaTasks, FaCalendarCheck, FaInfoCircle } from 'react-icons/fa';
import { useSocket } from '../../../context/SocketContext';
import { leaveService, taskService, attendanceService } from '../../../services';

const RequestNotificationsWidget = memo(({ limit = 10 }) => {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial fetch of recent activity
    useEffect(() => {
        const fetchActivity = async () => {
            try {
                setLoading(true);
                // Fetch recent data in parallel
                const [leavesRes, tasksRes, attendanceRes] = await Promise.allSettled([
                    leaveService.getAll({ limit: 5 }), // Recent leaves
                    taskService.getAll({ limit: 5 }), // Recent tasks
                    attendanceService.getAll({ limit: 5 }) // Recent attendance
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
            let newltem = null;
            const data = notif.data;

            switch (notif.type) {
                case 'LEAVE_APPLICATION':
                    newltem = {
                        id: `leave-${data.leave_id}`,
                        type: 'LEAVE_APPLICATION',
                        title: data.employee_name || 'New Leave Request', // Might need fetching name if not in payload
                        subtitle: `${data.leave_type} Request`,
                        message: notif.message,
                        time: new Date().toISOString(),
                        icon: <FaCalendarCheck />,
                        color: 'bg-amber-100 text-amber-600'
                    };
                    break;
                case 'TASK_ASSIGNED':
                    newltem = {
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
                    newltem = {
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
                    newltem = {
                        id: `att-${data.attendance_id}-${Date.now()}`, // Unique ID for stream
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

            if (newltem) {
                setNotifications(prev => [newltem, ...prev].slice(0, limit));
            }
        };

        socket.on('notification', handleNotification);
        return () => socket.off('notification', handleNotification);
    }, [socket, limit]);

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
            <div className="card-header">
                <div className="flex items-center gap-sm">
                    <div className="widget-icon-container bg-primary-50 text-primary-600">
                        <FaBell size={12} />
                    </div>
                    <h3 className="card-title text-sm uppercase tracking-wide">Live Activity</h3>
                </div>
                <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-success-50" style={{ backgroundColor: 'var(--success)' }}></span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-200">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }}></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                        <FaCheckCircle className="mb-2 text-success" size={32} />
                        <p className="text-sm">No recent activity</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((req) => (
                            <div key={req.id} className="p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors last:border-0 group">
                                <div className="flex justify-between items-start mb-1 h-auto">
                                    <div className="flex items-center gap-sm">
                                        <div className={`notification-icon ${req.color}`}>
                                            {req.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-neutral-900 leading-none m-0">
                                                {req.title}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-1 m-0">
                                                {req.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-neutral-400 whitespace-nowrap ml-2">
                                        {getTimeAgo(req.time)}
                                    </span>
                                </div>
                                {req.message && (
                                    <div className="mt-2 pl-10" style={{ paddingLeft: '2.75rem' }}>
                                        <p className="text-xs text-neutral-600 m-0 line-clamp-2">
                                            {req.message}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-neutral-200 bg-neutral-50 text-center">
                <button
                    onClick={() => navigate('/live-activity')}
                    className="text-xs font-medium text-primary-600 hover:underline cursor-pointer bg-transparent border-0"
                >
                    View All Activity
                </button>
            </div>
        </div>
    );
});

export default RequestNotificationsWidget;
