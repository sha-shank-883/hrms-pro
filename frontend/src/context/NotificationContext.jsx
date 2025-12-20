import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { leaveService, taskService, attendanceService, chatService, reportService } from '../services';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState({
        leaves: 0,
        tasks: 0,
        chat: 0,
        attendance: 0,
        liveActivity: 0
    });

    const [lastSeen, setLastSeen] = useState(() => {
        const saved = localStorage.getItem('hrms_last_seen');
        return saved ? JSON.parse(saved) : {};
    });

    const refreshCounts = useCallback(async () => {
        try {
            // Fetch actionable counts from backend
            const [leavesRes, tasksRes, statsRes, attendanceRes] = await Promise.allSettled([
                leaveService.getAll(),
                taskService.getAll(),
                reportService.getDashboardStats(),
                attendanceService.getRegularizationRequests()
            ]);

            const newCounts = { ...notifications };

            if (leavesRes.status === 'fulfilled') {
                newCounts.leaves = leavesRes.value.data.filter(l => l.status === 'pending').length;
            }

            if (tasksRes.status === 'fulfilled') {
                newCounts.tasks = tasksRes.value.data.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
            }

            if (attendanceRes.status === 'fulfilled') {
                newCounts.attendance = attendanceRes.value.data.filter(r => r.status === 'pending').length;
            }

            // Chat and LiveActivity are handled primarily via sockets and local persistence for "new since last view"
            // but we can initialize them if backend provides unread counts (chatService might)

            setNotifications(prev => ({ ...prev, ...newCounts }));
        } catch (error) {
            console.error('Failed to refresh notification counts:', error);
        }
    }, []);

    const markAsRead = useCallback((module) => {
        setNotifications(prev => ({ ...prev, [module]: 0 }));
        const now = new Date().toISOString();
        setLastSeen(prev => {
            const updated = { ...prev, [module]: now };
            localStorage.setItem('hrms_last_seen', JSON.stringify(updated));
            return updated;
        });
    }, []);

    useEffect(() => {
        refreshCounts();

        if (socket) {
            const handleSocketNotification = (data) => {
                const { type } = data;
                setNotifications(prev => {
                    const next = { ...prev };
                    if (type === 'LEAVE_APPLICATION') next.leaves += 1;
                    if (type === 'TASK_ASSIGNED') next.tasks += 1;
                    if (type === 'ATTENDANCE_LOG' || type === 'REGULARIZATION_REQUEST') next.attendance += 1;
                    if (type === 'LIVE_ACTIVITY' || true) next.liveActivity += 1; // Count all as live activity too
                    return next;
                });
            };

            const handleNewMessage = () => {
                setNotifications(prev => ({ ...prev, chat: prev.chat + 1 }));
            };

            socket.on('notification', handleSocketNotification);
            socket.on('new_message', handleNewMessage);
            socket.on('dashboard_update', refreshCounts);

            return () => {
                socket.off('notification', handleSocketNotification);
                socket.off('new_message', handleNewMessage);
                socket.off('dashboard_update', refreshCounts);
            };
        }
    }, [socket, refreshCounts]);

    return (
        <NotificationContext.Provider value={{ notifications, refreshCounts, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};
