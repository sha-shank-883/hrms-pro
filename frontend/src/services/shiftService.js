import api from './api';

export const shiftService = {
  // Shift definitions
  getAllShifts: async () => {
    const response = await api.get('/shifts');
    return response.data;
  },
  createShift: async (data) => {
    const response = await api.post('/shifts', data);
    return response.data;
  },
  updateShift: async (id, data) => {
    const response = await api.put(`/shifts/${id}`, data);
    return response.data;
  },
  deleteShift: async (id) => {
    const response = await api.delete(`/shifts/${id}`);
    return response.data;
  },

  // Shift assignments
  getAssignments: async (params) => {
    const response = await api.get('/shifts/assignments', { params });
    return response.data;
  },
  assignShift: async (data) => {
    const response = await api.post('/shifts/assign', data);
    return response.data;
  },
  deleteAssignment: async (id) => {
    const response = await api.delete(`/shifts/assignments/${id}`);
    return response.data;
  }
};
