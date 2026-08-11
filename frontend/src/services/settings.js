import api from './api';

export const settingsService = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
  },

  bulkUpdate: async (settingsArray) => {
    const response = await api.put('/settings', settingsArray);
    return response.data;
  },

  uploadLogo: async (formData) => {
    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
