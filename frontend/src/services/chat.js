import api from './api';

export const chatService = {
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  getMessages: async (otherUserId, params) => {
    const response = await api.get('/chat/messages', {
      params: { ...params, user2_id: otherUserId }
    });
    return response.data;
  },

  sendMessage: async (data) => {
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  markAsRead: async (senderId) => {
    const response = await api.put('/chat/messages/read', { sender_id: senderId });
    return response.data;
  },

  deleteMessage: async (id) => {
    const response = await api.delete(`/chat/messages/${id}`);
    return response.data;
  },

  deleteConversation: async (userId) => {
    const response = await api.delete(`/chat/conversations/${userId}`);
    return response.data;
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
