import api from './api';

export const taskService = {
  getAll: async (params) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/tasks/statistics');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getUpdates: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/updates`);
    return response.data;
  },

  addUpdate: async (taskId, data) => {
    const response = await api.post(`/tasks/${taskId}/updates`, data);
    return response.data;
  },
};
