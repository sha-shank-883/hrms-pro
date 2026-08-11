import axios from 'axios';
import { appStorage } from '../utils/storage';

// Replace this with the live backend URL when deploying
// For local Android emulator, use http://10.0.2.2:5001/api
// For physical devices on the same WiFi, use your local IP e.g., http://192.168.1.5:5001/api
// Set EXPO_PUBLIC_API_URL env var for production
export const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  async (config) => {
    const token = await appStorage.getItem('token');
    const tenantId = await appStorage.getItem('tenantId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }

    console.log('[API Request]', {
      url: config.url,
      method: config.method,
      data: config.data,
    });

    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Service
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  verify2FALogin: (data) => api.post('/auth/2fa/verify-login', data),
  requestPasswordReset: (data) => api.post('/auth/password/forgot', data),
  resetPassword: (data) => api.post('/auth/password/reset', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const leaveService = {
  getAllLeaves: () => api.get('/leaves'),
  getMyLeaves: () => api.get('/leaves'),
  getLeaveBalance: (empId) => api.get(`/leaves/balance/${empId}`),
  applyLeave: (data) => {
    if (!data.employee_id || !data.leave_type || !data.start_date || !data.end_date) {
      return Promise.reject(new Error('Missing required fields: employee_id, leave_type, start_date, end_date'));
    }
    return api.post('/leaves', data);
  },
  approveLeave: (id) => api.put(`/leaves/${id}/approve`, {}),
  rejectLeave: (id, reason) => api.put(`/leaves/${id}/reject`, { rejection_reason: reason }),
};

// Task Service
export const taskService = {
  getTasks: () => api.get('/tasks'),
  createTask: (data) => {
    if (!data.title) {
      return Promise.reject(new Error('Task title is required'));
    }
    return api.post('/tasks', {
      status: 'todo',
      category: 'general',
      priority: 'medium',
      ...data,
    });
  },
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  updateTaskStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  addUpdate: (taskId, data) => api.post(`/tasks/${taskId}/updates`, data),
  getUpdates: (taskId) => api.get(`/tasks/${taskId}/updates`),
};

// Employee Service
export const employeeService = {
  getEmployees: () => api.get('/employees'),
  getEmployeesForChat: (search) => api.get('/employees/chat', { params: search ? { search } : {} }),
  getEmployeeById: (id) => api.get(`/employees/${id}`),
  updateEmployee: (id, data) => {
    const sanitized = { ...data };
    delete sanitized.salary;
    delete sanitized.bank_account;
    delete sanitized.employee_id;
    return api.patch(`/employees/${id}`, sanitized);
  },
};

export const departmentService = {
  getDepartments: () => api.get('/departments'),
};

// Attendance Service
export const attendanceService = {
  checkToday: () => api.get('/attendance/today'),
  clockIn: (data) => {
    const payload = {
      location: 'Mobile App',
      ...data,
    };
    return api.post('/attendance/clock-in', payload);
  },
  clockOut: (data) => {
    const payload = {
      location: 'Mobile App',
      ...data,
    };
    return api.post('/attendance/clock-out', payload);
  },
  getHistory: (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    return api.get('/attendance/history', { params });
  },
};

export const payrollService = {
  getPayroll: () => api.get('/payroll'),
  getMyPayslips: () => api.get('/payroll/my-payslips'),
  getPayslipV2: (id) => api.get(`/payslips/${id}`),
  downloadPayslipPdf: async (id) => {
    const token = await appStorage.getItem('token');
    const tenantId = await appStorage.getItem('tenantId');
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
    const response = await fetch(`${baseUrl}/payslips/${id}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId || 'tenant_default',
      },
    });
    if (!response.ok) throw new Error('Download failed');
    return response;
  },
  queuePayslipEmail: (id) => api.post(`/payslips/${id}/email`),
  verifyPayslip: (id) => api.get(`/payslips/${id}/verify`),
};

export const settingsService = {
  getAllSettings: (params = {}) => api.get('/settings', { params }),
  getSettingByKey: (key) => api.get(`/settings/${key}`),
  updateSetting: (key, data) => api.put(`/settings/${key}`, data),
};

export const assetService = {
  getAssets: () => api.get('/assets'),
  createAsset: (data) => api.post('/assets', data),
  updateAsset: (id, data) => api.put(`/assets/${id}`, data),
};

export const documentService = {
  getDocuments: (params = {}) => api.get('/documents', { params }),
};

export const recruitmentService = {
  getJobs: () => api.get('/recruitment/jobs'),
  getApplications: () => api.get('/recruitment/applications'),
  applyJob: (jobId, data) => api.post(`/recruitment/jobs/${jobId}/apply`, data),
};

export const performanceService = {
  getGoals: () => api.get('/performance/goals'),
  getReviews: () => api.get('/performance/reviews'),
};

export const reportService = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getDemographics: () => api.get('/reports/demographics'),
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
};

export const chatService = {
  getMessages: (userId, params = {}) => api.get('/chat/messages', { params: { ...params, user2_id: userId } }),
  sendMessage: (data) => {
    if (!data.receiver_id && !data.user2_id) {
      return Promise.reject(new Error('Receiver ID is required'));
    }
    return api.post('/chat/messages', {
      ...data,
      user2_id: data.user2_id || data.receiver_id,
    });
  },
  getConversations: () => api.get('/chat/conversations'),
  markMessagesRead: (senderId) => api.put('/chat/messages/read', { sender_id: senderId }),
  addReaction: (messageId, reaction) => api.post('/chat/messages/reaction', { message_id: messageId, reaction }),
  deleteConversation: (contactId) => api.delete('/chat/conversations', { data: { contact_id: contactId } }),
  getChannels: () => api.get('/chat/channels'),
  createChannel: (data) => api.post('/chat/channels', data),
  joinChannel: (id) => api.post(`/chat/channels/${id}/join`),
  getChannelMessages: (id, params = {}) => api.get(`/chat/channels/${id}/messages`, { params }),
  uploadChatFile: (formData) => api.post('/upload/chat', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
  editMessage: (messageId, message) => api.put(`/chat/messages/${messageId}`, { message }),
};

export const auditService = {
  getLogs: () => api.get('/audit-logs').catch(() => api.get('/audit')), // fallback
};

export const holidayService = {
  getAll: (year) => api.get(`/holidays?year=${year}`),
  optIn: (data) => api.post('/holidays/opt-in', data),
};

export const shiftService = {
  getShifts: () => api.get('/shifts'),
  getEmployeeShifts: (empId) => api.get('/shifts/assignments', { params: empId ? { employee_id: empId } : {} }),
  getAssignments: (params = {}) => api.get('/shifts/assignments', { params }),
};

export const leadService = {
  getLeads: () => api.get('/leads'),
  createLead: (data) => api.post('/leads/demo', data),
};

export const cmsService = {
  getPages: () => api.get('/cms/pages'),
  getWebsiteSettings: () => api.get('/website-settings'),
};

export const tenantService = {
  getTenants: () => api.get('/tenants'),
  getBiometricDevices: () => api.get('/tenants/biometric-devices/all'),
};

export const mobileConfigService = {
  getPublicConfig: () => api.get('/mobile-config/public'),
  getAllConfigs: () => api.get('/mobile-config/all'),
  updateConfig: (key, data) => api.put(`/mobile-config/${key}`, data),
};

// Utility function to handle API errors consistently
export const handleApiError = (error) => {
  const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
  const status = error.response?.status;

  let userMessage = message;

  if (status === 400) {
    userMessage = 'Invalid request. Please check your input.';
  } else if (status === 401) {
    userMessage = 'Session expired. Please log in again.';
  } else if (status === 403) {
    userMessage = 'You do not have permission to perform this action.';
  } else if (status === 404) {
    userMessage = 'Resource not found.';
  } else if (status === 409) {
    userMessage = 'This operation conflicts with existing data.';
  } else if (status === 422) {
    userMessage = 'Please check the submitted data.';
  } else if (status === 500) {
    userMessage = 'Server error. Please try again later.';
  }

  return {
    message: userMessage,
    status,
    originalMessage: message,
    data: error.response?.data,
  };
};

export default api;
