import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../api';
import { appStorage } from '../utils/storage';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, tenantId } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && tenantId) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [user, tenantId]);

  const connectSocket = async () => {
    const token = await appStorage.getItem('token');
    if (!token) return;

    const baseUrl = API_URL.replace('/api', '');

    const newSocket = io(baseUrl, {
      query: { tenantId },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected', newSocket.id);
      newSocket.emit('join', { userId: user.user_id || user.id, token });
    });

    newSocket.on('update_online_users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  };

  return (
    <ChatContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
