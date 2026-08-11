import api from './api';

export const documentService = {
  getAll: async (params) => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  upload: async (formData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};
