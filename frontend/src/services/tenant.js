import api from './api';

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
      data: { twoFactorToken }
    });
    return response.data;
  },

  getBiometricDevices: async () => {
    const response = await api.get('/tenants/biometric-devices/all');
    return response.data;
  },

  registerBiometricDevice: async (data) => {
    const response = await api.post('/tenants/biometric-devices/register', data);
    return response.data;
  },

  deleteBiometricDevice: async (serialNumber) => {
    const response = await api.delete(`/tenants/biometric-devices/${serialNumber}`);
    return response.data;
  }
};
