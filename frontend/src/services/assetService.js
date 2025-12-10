import api from './api';

const assetService = {
    getAll: (params) => api.get('/assets', { params }),
    create: (data) => api.post('/assets', data),
    update: (id, data) => api.put(`/assets/${id}`, data),
    delete: (id) => api.delete(`/assets/${id}`),
};

export default assetService;
