import api from './api';

export const reportService = {
  getDashboardStats: async () => {
    const response = await api.get(`/reports/dashboard?_t=${new Date().getTime()}`);
    return response.data;
  },

  getChurnRiskAnalysis: async (params) => {
    const response = await api.get('/reports/churn-risk', { params });
    return response.data;
  },

  getTurnoverPrediction: async () => {
    const response = await api.get('/reports/turnover-prediction');
    return response.data;
  },

  getPerformanceAnalytics: async () => {
    const response = await api.get('/reports/performance-analytics');
    return response.data;
  },

  getPayrollTrends: async () => {
    const response = await api.get('/reports/payroll-trends');
    return response.data;
  },

  getAttendanceTrends: async () => {
    const response = await api.get('/reports/attendance-trends');
    return response.data;
  },

  getAttendanceReport: async (params) => {
    const response = await api.get('/reports/attendance', { params });
    return response.data;
  },

  getLeaveReport: async (params) => {
    const response = await api.get('/reports/leave', { params });
    return response.data;
  },

  getPayrollReport: async (params) => {
    const response = await api.get('/reports/payroll', { params });
    return response.data;
  },

  getEmployeeReport: async () => {
    const response = await api.get('/reports/employee');
    return response.data;
  },

  getRecruitmentReport: async (params) => {
    const response = await api.get('/reports/recruitment', { params });
    return response.data;
  },

  getEmployeeDemographics: async (params) => {
    const response = await api.get('/reports/employee-demographics', { params });
    return response.data;
  },
};
