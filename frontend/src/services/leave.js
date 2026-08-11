import api from './api';

export const leaveService = {
  getAll: async (params) => {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  getStatistics: async (params) => {
    const response = await api.get('/leaves/statistics', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/leaves', data);
    return response.data;
  },

  updateStatus: async (id, status, comments) => {
    const response = await api.put(`/leaves/${id}/status`, { status, comments });
    return response.data;
  },

  getBalance: async (employeeId) => {
    const response = await api.get(`/leaves/balance/${employeeId}`);
    return response.data;
  },

  getAllBalances: async () => {
    const response = await api.get('/leaves/balance');
    return response.data;
  },

  requestCompOff: async (data) => {
    const response = await api.post('/leaves/comp-off', data);
    return response.data;
  },

  getCompOffRequests: async (params) => {
    const response = await api.get('/leaves/comp-off', { params });
    return response.data;
  }
};
