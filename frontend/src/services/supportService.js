import api from './api';

export const supportService = {
  // Chat
  startChat: async (department) => {
    const response = await api.post('/support/chat/start', { department });
    return response.data;
  },
  getChatHistory: async (chatId) => {
    const response = await api.get(`/support/chat/history/${chatId}`);
    return response.data;
  },
  getMyChats: async (params) => {
    const response = await api.get('/support/chat/my', { params });
    return response.data;
  },
  closeChat: async (chatId) => {
    const response = await api.put(`/support/chat/${chatId}/close`);
    return response.data;
  },
  resolveChat: async (chatId) => {
    const response = await api.put(`/support/chat/${chatId}/resolve`);
    return response.data;
  },

  // FAQ
  getFAQs: async (params) => {
    const response = await api.get('/support/faq', { params });
    return response.data;
  },
  getFAQById: async (id) => {
    const response = await api.get(`/support/faq/${id}`);
    return response.data;
  },
  createFAQ: async (data) => {
    const response = await api.post('/support/faq', data);
    return response.data;
  },
  updateFAQ: async (id, data) => {
    const response = await api.put(`/support/faq/${id}`, data);
    return response.data;
  },
  deleteFAQ: async (id) => {
    const response = await api.delete(`/support/faq/${id}`);
    return response.data;
  },
  faqFeedback: async (id, helpful) => {
    const response = await api.post(`/support/faq/${id}/feedback`, { helpful });
    return response.data;
  },
  getFAQCategories: async () => {
    const response = await api.get('/support/faq/categories');
    return response.data;
  },
  createFAOCategory: async (data) => {
    const response = await api.post('/support/faq/categories', data);
    return response.data;
  },
  updateFAOCategory: async (id, data) => {
    const response = await api.put(`/support/faq/categories/${id}`, data);
    return response.data;
  },
  deleteFAOCategory: async (id) => {
    const response = await api.delete(`/support/faq/categories/${id}`);
    return response.data;
  },

  // Tickets
  getTickets: async (params) => {
    const response = await api.get('/support/tickets', { params });
    return response.data;
  },
  getTicketById: async (id) => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },
  createTicket: async (data) => {
    const response = await api.post('/support/tickets', data);
    return response.data;
  },
  updateTicketStatus: async (id, data) => {
    const response = await api.put(`/support/tickets/${id}/status`, data);
    return response.data;
  },
  assignTicket: async (id, agentId) => {
    const response = await api.put(`/support/tickets/${id}/assign`, { agent_id: agentId });
    return response.data;
  },
  addTicketComment: async (id, data) => {
    const response = await api.post(`/support/tickets/${id}/comments`, data);
    return response.data;
  },
  getTicketStats: async () => {
    const response = await api.get('/support/tickets/stats');
    return response.data;
  },

  // AI
  askAI: async (message, chatId) => {
    const response = await api.post('/support/ai/ask', { message, chatId });
    return response.data;
  },

  // Admin
  getAdminChats: async (params) => {
    const response = await api.get('/support/admin/chats', { params });
    return response.data;
  },
  getAdminDashboard: async () => {
    const response = await api.get('/support/admin/dashboard');
    return response.data;
  },
  getAdminAgents: async () => {
    const response = await api.get('/support/admin/agents');
    return response.data;
  },
  addAdminAgent: async (userId) => {
    const response = await api.post('/support/admin/agents', { user_id: userId });
    return response.data;
  },
  updateAdminAgent: async (id, data) => {
    const response = await api.put(`/support/admin/agents/${id}`, data);
    return response.data;
  },
  removeAdminAgent: async (id) => {
    const response = await api.delete(`/support/admin/agents/${id}`);
    return response.data;
  },

  // Canned Replies
  getCannedReplies: async (params) => {
    const response = await api.get('/support/canned-replies', { params });
    return response.data;
  },
  createCannedReply: async (data) => {
    const response = await api.post('/support/canned-replies', data);
    return response.data;
  },
  updateCannedReply: async (id, data) => {
    const response = await api.put(`/support/canned-replies/${id}`, data);
    return response.data;
  },
  deleteCannedReply: async (id) => {
    const response = await api.delete(`/support/canned-replies/${id}`);
    return response.data;
  }
};
