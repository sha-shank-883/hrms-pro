import api from './api';

// Authentication services
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && !response.data.requires2FA) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  register: async (email, password, role) => {
    const response = await api.post('/auth/register', { email, password, role });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Don't redirect here - let React Router handle navigation
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  adminChangeUserPassword: async (userId, newPassword) => {
    const response = await api.put(`/auth/change-password/${userId}`, {
      newPassword,
    });
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    try {
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  // 2FA Methods
  setup2FA: async () => {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
  },

  verify2FASetup: async (token) => {
    const response = await api.post('/auth/2fa/verify-setup', { token });
    return response.data;
  },

  verify2FALogin: async (userId, token) => {
    const response = await api.post('/auth/2fa/verify-login', { userId, token });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  disable2FA: async () => {
    const response = await api.post('/auth/2fa/disable');
    return response.data;
  }
};

// Department services
export const departmentService = {
  getAll: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};

// Employee services
export const employeeService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/employees', { params });
      // Handle both old format (without pagination) and new format (with pagination)
      if (response.data.pagination) {
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      // Fallback for old format
      return {
        data: response.data.data || response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.count || (response.data.data ? response.data.data.length : 0),
          itemsPerPage: 10,
          hasNext: false,
          hasPrev: false
        }
      };
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  getByUserId: async (userId) => {
    const response = await api.get(`/employees/user/${userId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  updatePartial: async (id, data) => {
    const response = await api.patch(`/employees/${id}`, data);
    return response.data;
  },

  getQRCode: async (id) => {
    const response = await api.get(`/employees/${id}/qrcode`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  getForChat: async (params) => {
    const response = await api.get('/employees/chat', { params });
    return response.data;
  },

  getOrgChart: async () => {
    const response = await api.get('/employees/org-chart');
    return response.data;
  }
};

// Attendance services
export const attendanceService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/attendance', { params });
      // Handle both old format (without pagination) and new format (with pagination)
      if (response.data.pagination) {
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      // Fallback for old format
      return {
        data: response.data.data || response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.count || (response.data.data ? response.data.data.length : 0),
          itemsPerPage: 10,
          hasNext: false,
          hasPrev: false
        }
      };
    } catch (error) {
      throw error;
    }
  },

  clockIn: async (employee_id) => {
    try {
      const response = await api.post('/attendance/clock-in', { employee_id });
      return response.data;
    } catch (error) {
      // If it's a 401 error (unauthorized), dispatch auth:logout event
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw error;
    }
  },

  clockOut: async (employee_id) => {
    try {
      const response = await api.post('/attendance/clock-out', { employee_id });
      return response.data;
    } catch (error) {
      // If it's a 401 error (unauthorized), dispatch auth:logout event
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw error;
    }
  },

  update: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  requestRegularization: async (data) => {
    const response = await api.post('/attendance/regularize', data);
    return response.data;
  },

  getRegularizationRequests: async (params) => {
    const response = await api.get('/attendance/regularize', { params });
    return response.data;
  },

  updateRegularizationStatus: async (id, status) => {
    const response = await api.put(`/attendance/regularize/${id}`, { status });
    return response.data;
  },
};

// Leave services
export const leaveService = {
  getAll: async (params) => {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  getStatistics: async (params) => {
    const response = await api.get('/leaves/statistics', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/leaves', data);
    return response.data;
  },

  updateStatus: async (id, status, comments) => {
    const response = await api.put(`/leaves/${id}/status`, { status, comments });
    return response.data;
  },

  getBalance: async (employeeId) => {
    const response = await api.get(`/leaves/balance/${employeeId}`);
    return response.data;
  },

  getAllBalances: async () => {
    const response = await api.get('/leaves/balance');
    return response.data;
  },

  requestCompOff: async (data) => {
    const response = await api.post('/leaves/comp-off', data);
    return response.data;
  },

  getCompOffRequests: async (params) => {
    const response = await api.get('/leaves/comp-off', { params });
    return response.data;
  }
};

// Task services
export const taskService = {
  getAll: async (params) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/tasks/statistics');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

// Payroll services
export const payrollService = {
  getAll: async (params) => {
    const response = await api.get('/payroll', { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/payroll/statistics');
    return response.data;
  },

  generate: async (data) => {
    const response = await api.post('/payroll/generate', data);
    return response.data;
  },

  processPayment: async (id, paymentMethod) => {
    const response = await api.put(`/payroll/${id}/process`, { payment_method: paymentMethod });
    return response.data;
  },

  getPayslip: async (id) => {
    const response = await api.get(`/payroll/${id}/payslip`);
    return response.data;
  },

  getMyPayslips: async () => {
    const response = await api.get('/payroll/my-payslips');
    return response.data;
  },

  submitTaxDeclaration: async (data) => {
    const response = await api.post('/payroll/tax-declarations', data);
    return response.data;
  },

  getTaxDeclarations: async (params) => {
    const response = await api.get('/payroll/tax-declarations', { params });
    return response.data;
  },

  updateTaxDeclarationStatus: async (id, data) => {
    const response = await api.put(`/payroll/tax-declarations/${id}`, data);
    return response.data;
  }
};

// Recruitment services
export const recruitmentService = {
  // Job Postings
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

  // Applications
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

  // Legacy/Alias support if needed (keeping for safety if used elsewhere)
  getAllCandidates: async () => {
    const response = await api.get('/recruitment/applications'); // Mapping to new endpoint
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

// Document services
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

// Chat services
// Chat services
export const chatService = {
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  getMessages: async (otherUserId, params) => {
    const response = await api.get('/chat/messages', {
      params: { ...params, user2_id: otherUserId }
    });
    return response.data;
  },

  sendMessage: async (data) => {
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  markAsRead: async (senderId) => {
    // Note: This endpoint expects message_ids in body, but we might want to mark all from a sender
    // For now, we'll leave it as is or if the backend supports it.
    // Actually, let's just match the backend expectation if possible, or skip if not used.
    // Chat.jsx uses socket for this. We'll add it for completeness if needed.
    const response = await api.put('/chat/messages/read', { sender_id: senderId });
    return response.data;
  },

  deleteMessage: async (id) => {
    const response = await api.delete(`/chat/messages/${id}`);
    return response.data;
  },

  deleteConversation: async (userId) => {
    const response = await api.delete(`/chat/conversations/${userId}`);
    return response.data;
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};


// Report services
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

  getEmployeeDemographics: async (params) => {
    const response = await api.get('/reports/employee-demographics', { params });
    return response.data;
  },
};

// Settings services
export const settingsService = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
  },

  bulkUpdate: async (settingsArray) => {
    const response = await api.put('/settings', settingsArray);
    return response.data;
  },

  uploadLogo: async (formData) => {
    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Upload service
export const uploadService = {
  uploadFile: async (formData) => {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Tenant services
export const tenantService = {
  getAll: async () => {
    const response = await api.get('/tenants');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/tenants', data);
    return response.data;
  },

  update: async (tenantId, data) => {
    const response = await api.put(`/tenants/${tenantId}`, data);
    return response.data;
  },

  resetAdminPassword: async (tenantId, newPassword) => {
    const response = await api.post(`/tenants/${tenantId}/reset-password`, { newPassword });
    return response.data;
  },

  delete: async (tenantId, twoFactorToken) => {
    const response = await api.delete(`/tenants/${tenantId}`, {
      headers: {
        'x-2fa-token': twoFactorToken
      },
      data: { twoFactorToken } // Keep body for backward compatibility if needed, but headers is primary fix
    });
    return response.data;
  }
};

// Holiday Services
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

// Performance services
import performanceService from './performanceService';

// Asset services
import assetService from './assetService';

// Audit services
import auditService from './auditService';

export {
  performanceService,
  assetService,
  auditService
};
