import api from './api';

export const holidayService = {
  getAll: async (year) => {
    const response = await api.get('/holidays', { params: { year } });
    return response.data;
  },

  getMyRestricted: async (year, employeeId) => {
    const response = await api.get('/holidays/my-restricted', { params: { year, employee_id: employeeId } });
    return response.data;
  },

  optIn: async (employeeId, holidayId) => {
    const response = await api.post('/holidays/opt-in', { employee_id: employeeId, holiday_id: holidayId });
    return response.data;
  }
};
