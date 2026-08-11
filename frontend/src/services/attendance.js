import api from './api';

export const attendanceService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/attendance', { params });
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

  clockIn: async (employee_id, latitude, longitude) => {
    try {
      const response = await api.post('/attendance/clock-in', { employee_id, latitude, longitude });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw error;
    }
  },

  clockOut: async (employee_id, latitude, longitude) => {
    try {
      const response = await api.post('/attendance/clock-out', { employee_id, latitude, longitude });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw error;
    }
  },

  update: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  requestRegularization: async (data) => {
    const response = await api.post('/attendance/regularize', data);
    return response.data;
  },

  getRegularizationRequests: async (params) => {
    const response = await api.get('/attendance/regularize', { params });
    return response.data;
  },

  updateRegularizationStatus: async (id, status) => {
    const response = await api.put(`/attendance/regularize/${id}`, { status });
    return response.data;
  },
};
