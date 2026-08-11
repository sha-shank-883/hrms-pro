import api from './api';

export const recruitmentService = {
  getAllJobs: async (params) => {
    const response = await api.get('/recruitment/jobs', { params });
    return response.data;
  },

  createJob: async (data) => {
    const response = await api.post('/recruitment/jobs', data);
    return response.data;
  },

  updateJob: async (id, data) => {
    const response = await api.put(`/recruitment/jobs/${id}`, data);
    return response.data;
  },

  deleteJob: async (id) => {
    const response = await api.delete(`/recruitment/jobs/${id}`);
    return response.data;
  },

  getAllApplications: async (params) => {
    const response = await api.get('/recruitment/applications', { params });
    return response.data;
  },

  createApplication: async (data) => {
    const response = await api.post('/recruitment/applications', data);
    return response.data;
  },

  updateApplicationStatus: async (id, data) => {
    const response = await api.put(`/recruitment/applications/${id}`, data);
    return response.data;
  },

  deleteApplication: async (id) => {
    const response = await api.delete(`/recruitment/applications/${id}`);
    return response.data;
  },

  getAllCandidates: async () => {
    const response = await api.get('/recruitment/applications');
    return response.data;
  },

  parseResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await api.post('/recruitment/resume/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
