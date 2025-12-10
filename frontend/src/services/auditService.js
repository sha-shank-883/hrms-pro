import api from './api';

const auditService = {
    getLogs: (params) => api.get('/audit-logs', { params }),
};

export default auditService;
