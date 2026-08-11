import api from './api';

export const employeeService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/employees', { params });
      if (response.data.pagination) {
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      return {
        data: response.data.data || response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.count || (response.data.data ? response.data.data.length : 0),
          itemsPerPage: 10,
          hasNext: false,
          hasPrev: false
        }
      };
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  getByUserId: async (userId) => {
    const response = await api.get(`/employees/user/${userId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  updatePartial: async (id, data) => {
    const response = await api.patch(`/employees/${id}`, data);
    return response.data;
  },

  getQRCode: async (id) => {
    const response = await api.get(`/employees/${id}/qrcode`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  getForChat: async (params) => {
    const response = await api.get('/employees/chat', { params });
    return response.data;
  },

  getOrgChart: async () => {
    const response = await api.get('/employees/org-chart');
    return response.data;
  }
};
