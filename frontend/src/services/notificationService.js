import api from './api';

export const notificationService = {
  getBadgeCounts: async () => {
    const response = await api.get('/notifications/badge-counts');
    return response.data;
  },

  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/notifications/settings', data);
    return response.data;
  }
};

export default notificationService;
