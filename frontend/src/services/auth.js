import api from './api';

export const authService = {
  login: async (email, password, extra = {}) => {
    const response = await api.post('/auth/login', { email, password, ...extra });
    if (response.data.success && !response.data.requires2FA) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      if (response.data.data.user?.tenant_id) {
        localStorage.setItem('tenant_id', response.data.data.user.tenant_id);
      }
    }
    return response.data;
  },

  signup: async (formData) => {
    const response = await api.post('/auth/signup', formData);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      if (response.data.data.user?.tenant_id) {
        localStorage.setItem('tenant_id', response.data.data.user.tenant_id);
      }
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
    localStorage.removeItem('tenant_id');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
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

  adminUpdatePermissions: async (userId, permissions) => {
    const response = await api.put(`/auth/permissions/${userId}`, {
      permissions,
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
