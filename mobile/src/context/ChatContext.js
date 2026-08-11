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
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: [userIds] }
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

    newSocket.on('user_typing', ({ sender_id }) => {
      setTypingUsers(prev => ({
        ...prev,
        [sender_id]: [...(prev[sender_id] || []).filter(id => id !== sender_id), sender_id]
      }));
    });

    newSocket.on('user_stop_typing', ({ sender_id }) => {
      setTypingUsers(prev => ({
        ...prev,
        [sender_id]: (prev[sender_id] || []).filter(id => id !== sender_id)
      }));
    });
    
    newSocket.on('message_reaction', (data) => {
      // This will be handled by the screen listening to the socket directly or via state
      // For now we just emit it globally if needed, but the screen usually handles it
    });

    newSocket.on('messages_read', ({ reader_id }) => {
      // Global read notification if needed
    });
    
    newSocket.on('message_edited', (data) => {
      // Handled by screen usually via events, but we can store in state if needed
    });

    newSocket.on('message_deleted', (data) => {
      // Handled by screen
    });

    newSocket.on('message_starred', (data) => {
      // Handled by screen
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const sendTyping = (receiverId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { receiver_id: receiverId, sender_id: user.user_id || user.id });
    }
  };

  const sendStopTyping = (receiverId) => {
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { receiver_id: receiverId, sender_id: user.user_id || user.id });
    }
  };

  const reactToMessage = (messageId, reaction) => {
    if (socketRef.current) {
      socketRef.current.emit('message_reaction', { messageId, reaction });
    }
  };

  const editMessage = (messageId, message) => {
    if (socketRef.current) {
      socketRef.current.emit('edit_message', { messageId, message });
    }
  };

  const deleteMessage = (messageId) => {
    if (socketRef.current) {
      socketRef.current.emit('delete_message', { messageId });
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      socket, 
      onlineUsers, 
      typingUsers, 
      sendTyping, 
      sendStopTyping, 
      reactToMessage,
      editMessage,
      deleteMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
