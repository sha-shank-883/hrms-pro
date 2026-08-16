import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { socket } = useSocket();
    
    // Dynamic Badge Counts per Module
    const [notifications, setNotifications] = useState({
        leaves: 0,
        attendance: 0,
        tasks: 0,
        chat: 0,
        expenses: 0,
        offboarding: 0,
        support: 0,
        notifications: 0,
        total: 0
    });

    // In-App Notification Feed List
    const [feed, setFeed] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingFeed, setLoadingFeed] = useState(false);
    const [settings, setSettings] = useState({
        enable_web_push: true,
        enable_in_app_sound: true,
        enable_email_alerts: true
    });

    // Audio chime player
    const playNotificationSound = useCallback(() => {
        try {
            if (settings.enable_in_app_sound !== false) {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch (e) {
            // Audio context blocked or unsupported
        }
    }, [settings]);

    // Refresh dynamic badge counts
    const refreshCounts = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await notificationService.getBadgeCounts();
            if (res.success && res.counts) {
                const totalCount = res.counts.total !== undefined ? res.counts.total : (
                    (res.counts.leaves || 0) +
                    (res.counts.attendance || 0) +
                    (res.counts.tasks || 0) +
                    (res.counts.chat || 0) +
                    (res.counts.leads || 0) +
                    (res.counts.billing || 0) +
                    (res.counts.tenants || 0) +
                    (res.counts.notifications || 0)
                );

                setNotifications({
                    leaves: res.counts.leaves || 0,
                    attendance: res.counts.attendance || 0,
                    tasks: res.counts.tasks || 0,
                    chat: res.counts.chat || 0,
                    expenses: res.counts.expenses || 0,
                    offboarding: res.counts.offboarding || 0,
                    support: res.counts.support || 0,
                    leads: res.counts.leads || 0,
                    billing: res.counts.billing || 0,
                    tenants: res.counts.tenants || 0,
                    notifications: res.counts.notifications || 0,
                    total: totalCount
                });
                setUnreadCount(res.counts.notifications || totalCount || 0);
            }
        } catch (error) {
            console.error('Failed to refresh notification counts:', error);
        }
    }, []);

    // Load in-app notifications feed
    const loadFeed = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            setLoadingFeed(true);
            const res = await notificationService.getNotifications({ limit: 15 });
            if (res.success) {
                setFeed(res.data || []);
                setUnreadCount(res.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to load notifications feed:', error);
        } finally {
            setLoadingFeed(false);
        }
    }, []);

    // Load tenant notification settings
    const loadSettings = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await notificationService.getSettings();
            if (res.success && res.data) {
                setSettings(res.data);
            }
        } catch (error) {
            // Ignore if not admin
        }
    }, []);

    // Mark single notification as read
    const markAsRead = useCallback(async (idOrModule) => {
        if (!idOrModule) return;
        const knownModules = ['leaves', 'attendance', 'tasks', 'chat', 'expenses', 'offboarding', 'support', 'leads', 'billing', 'tenants'];

        if (knownModules.includes(idOrModule)) {
            // Module level badge clear
            setNotifications(prev => ({
                ...prev,
                [idOrModule]: 0,
                total: Math.max(0, (prev.total || 0) - (prev[idOrModule] || 0))
            }));
            return;
        }

        // Notification item ID (e.g. 12, 'demo_1', 'pay_20', 'contact_3')
        try {
            await notificationService.markAsRead(idOrModule);
            setFeed(prev => prev.map(item => String(item.id) === String(idOrModule) ? { ...item, is_read: true } : item));
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => ({
                ...prev,
                notifications: Math.max(0, (prev.notifications || 0) - 1),
                total: Math.max(0, (prev.total || 0) - 1)
            }));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setFeed(prev => prev.map(item => ({ ...item, is_read: true })));
            setUnreadCount(0);
            setNotifications({
                leaves: 0,
                attendance: 0,
                tasks: 0,
                chat: 0,
                expenses: 0,
                offboarding: 0,
                support: 0,
                leads: 0,
                billing: 0,
                tenants: 0,
                notifications: 0,
                total: 0
            });
            // Re-fetch badge counts to sync with server state
            const res = await notificationService.getBadgeCounts();
            if (res?.success && res.counts) {
                setNotifications(prev => ({ ...prev, ...res.counts }));
                setUnreadCount(res.counts.notifications || res.counts.total || 0);
            }
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    }, []);

    // Request desktop browser push permission
    const requestWebPushPermission = useCallback(async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }, []);

    // Initial load
    useEffect(() => {
        refreshCounts();
        loadFeed();
        loadSettings();
    }, [refreshCounts, loadFeed, loadSettings]);

    // Socket real-time event listeners
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notif) => {
            setFeed(prev => [notif, ...prev.slice(0, 19)]);
            setUnreadCount(prev => prev + 1);
            setNotifications(prev => ({
                ...prev,
                notifications: (prev.notifications || 0) + 1,
                total: (prev.total || 0) + 1
            }));
            playNotificationSound();

            // Desktop Browser Notification
            if ('Notification' in window && Notification.permission === 'granted' && settings.enable_web_push) {
                try {
                    new Notification(notif.title || 'HRMS Pro Notification', {
                        body: notif.message,
                        icon: '/favicon.ico'
                    });
                } catch (e) {}
            }
        };

        const handleSocketNotification = (data) => {
            const { type } = data || {};
            setNotifications(prev => {
                const next = { ...prev };
                if (type === 'LEAVE_APPLICATION' || type === 'LEAVE_STATUS') next.leaves += 1;
                if (type === 'TASK_ASSIGNED') next.tasks += 1;
                if (type === 'ATTENDANCE_LOG' || type === 'REGULARIZATION_REQUEST') next.attendance += 1;
                next.total = next.leaves + next.attendance + next.tasks + next.chat + next.notifications;
                return next;
            });
            playNotificationSound();
        };

        const handleNewMessage = () => {
            setNotifications(prev => ({
                ...prev,
                chat: (prev.chat || 0) + 1,
                total: (prev.total || 0) + 1
            }));
            playNotificationSound();
        };

        socket.on('notification:new', handleNewNotification);
        socket.on('notification', handleSocketNotification);
        socket.on('new_message', handleNewMessage);
        socket.on('dashboard_update', refreshCounts);

        return () => {
            socket.off('notification:new', handleNewNotification);
            socket.off('notification', handleSocketNotification);
            socket.off('new_message', handleNewMessage);
            socket.off('dashboard_update', refreshCounts);
        };
    }, [socket, playNotificationSound, refreshCounts, settings.enable_web_push]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            badgeCounts: notifications,
            feed,
            unreadCount,
            loadingFeed,
            settings,
            refreshCounts,
            loadFeed,
            markAsRead,
            markAllAsRead,
            requestWebPushPermission
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
