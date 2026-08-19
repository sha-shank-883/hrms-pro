import api from './api';

export const aiIntelligenceService = {
  // 1. Screen Candidate Resume
  screenResume: async (data) => {
    const response = await api.post('/ai-intelligence/screen-resume', data);
    return response.data;
  },

  // 2. Batch Candidate Screening
  batchScreenCandidates: async (data) => {
    const response = await api.post('/ai-intelligence/batch-screen-candidates', data);
    return response.data;
  },

  // 3. Generate Job Description
  generateJobDescription: async (data) => {
    const response = await api.post('/ai-intelligence/generate-job-description', data);
    return response.data;
  },

  // 4. Draft HR Email
  draftEmail: async (data) => {
    const response = await api.post('/ai-intelligence/draft-email', data);
    return response.data;
  },

  // 5. Employee Performance Summary
  generatePerformanceSummary: async (data) => {
    const response = await api.post('/ai-intelligence/performance-summary', data);
    return response.data;
  },

  // 6. Company Executive Insights
  generateExecutiveInsights: async (data = {}) => {
    const response = await api.post('/ai-intelligence/executive-insights', data);
    return response.data;
  },

  // 7. AI Quota Status
  getQuotaStatus: async () => {
    const response = await api.get('/ai-intelligence/quota-status');
    return response.data;
  }
};

export default aiIntelligenceService;
