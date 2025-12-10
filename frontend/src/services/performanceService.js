import api from './api';

const performanceService = {
    // Goals
    getGoals: async (params) => {
        const response = await api.get('/performance/goals', { params });
        return response.data;
    },
    createGoal: async (data) => {
        const response = await api.post('/performance/goals', data);
        return response.data;
    },
    updateGoal: async (id, data) => {
        const response = await api.put(`/performance/goals/${id}`, data);
        return response.data;
    },
    deleteGoal: async (id) => {
        const response = await api.delete(`/performance/goals/${id}`);
        return response.data;
    },

    // Cycles
    getCycles: async (params) => {
        const response = await api.get('/performance/cycles', { params });
        return response.data;
    },
    createCycle: async (data) => {
        const response = await api.post('/performance/cycles', data);
        return response.data;
    },

    // Reviews
    getReviews: async (params) => {
        const response = await api.get('/performance/reviews', { params });
        return response.data;
    },
    getReviewById: async (id) => {
        const response = await api.get(`/performance/reviews/${id}`);
        return response.data;
    },
    createReview: async (data) => {
        const response = await api.post('/performance/reviews', data);
        return response.data;
    },
    updateReview: async (id, data) => {
        const response = await api.put(`/performance/reviews/${id}`, data);
        return response.data;
    },
};

export default performanceService;
