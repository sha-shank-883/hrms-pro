import api from './api';

export const mobileConfigService = {
  getAll: async () => {
    const response = await api.get('/mobile-config/all');
    return response.data;
  },

  update: async (key, data) => {
    const response = await api.put(`/mobile-config/${key}`, data);
    return response.data;
  }
};
