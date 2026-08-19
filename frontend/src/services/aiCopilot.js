import api from './api';

export const aiCopilotService = {
  /**
   * Send a chat message to the autonomous AI Copilot
   */
  chat: async (message, conversationHistory = []) => {
    const response = await api.post('/ai/copilot/chat', {
      message,
      conversationHistory
    });
    return response.data;
  },

  /**
   * Get contextual suggestions based on current user role
   */
  getSuggestions: async () => {
    const response = await api.get('/ai/copilot/suggestions');
    return response.data;
  }
};
