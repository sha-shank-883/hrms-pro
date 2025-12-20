import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        // Only connect if user is logged in
        if (user) {
            const tenantId = localStorage.getItem('tenant_id');
            const token = localStorage.getItem('token');

            // Determine backend URL (handle both Vercel/Render and local)
            // VITE_API_URL usually points to /api, so we might need to trim it or use a separate VITE_SOCKET_URL
            // If VITE_API_URL is "http://localhost:5000/api", we want "http://localhost:5000"
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const socketUrl = apiUrl.replace('/api', '');

            const newSocket = io(socketUrl, {
                query: {
                    tenantId: tenantId || 'tenant_default',
                },
                auth: {
                    token: token
                },
                transports: ['websocket'], // Use WebSocket first
                withCredentials: true
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket Connected:', newSocket.id);
                // Join with User ID for private messaging / notifications
                newSocket.emit('join', user.user_id || user.id); // Handle both id formats if needed
            });

            newSocket.on('update_online_users', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('connect_error', (err) => {
                console.error('❌ Socket Connection Error:', err);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            // Cleanup if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]); // Re-run if user changes (login/logout)

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
