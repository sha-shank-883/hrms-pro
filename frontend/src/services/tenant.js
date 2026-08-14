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
  },

  impersonate: async (tenantId) => {
    const response = await api.post(`/tenants/${tenantId}/impersonate`);
    return response.data;
  },

  backup: async (tenantId) => {
    const response = await api.get(`/tenants/${tenantId}/backup`, { responseType: 'blob' });
    return response;
  },

  restore: async (tenantId, backupJson) => {
    const response = await api.post(`/tenants/${tenantId}/restore`, backupJson, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000 // 2 min timeout for large restores
    });
    return response.data;
  },

  getPlanConfigs: async () => {
    const response = await api.get('/tenants/plans/configs');
    return response.data;
  },

  updatePlanConfig: async (planId, data) => {
    const response = await api.put(`/tenants/plans/configs/${planId}`, data);
    return response.data;
  },

  getTenantModules: async (tenantId) => {
    const response = await api.get(`/tenants/${tenantId}/modules`);
    return response.data;
  },

  updateTenantModules: async (tenantId, data) => {
    const response = await api.put(`/tenants/${tenantId}/modules`, data);
    return response.data;
  },

  getBillingOverview: async () => {
    const response = await api.get('/tenants/billing/overview');
    return response.data;
  },

  getTenantBillingProfile: async (tenantId) => {
    const response = await api.get(`/tenants/${tenantId}/billing-profile`);
    return response.data;
  },

  updateTenantBillingProfile: async (tenantId, data) => {
    const response = await api.put(`/tenants/${tenantId}/billing-profile`, data);
    return response.data;
  },

  recordManualPayment: async (data) => {
    const response = await api.post('/tenants/billing/record-manual', data);
    return response.data;
  },

  getMyBilling: async () => {
    const response = await api.get('/tenants/my-billing');
    return response.data;
  },

  updateMyBilling: async (data) => {
    const response = await api.put('/tenants/my-billing', data);
    return response.data;
  },

  getInvoice: async (invoiceId) => {
    const response = await api.get(`/tenants/invoice/${invoiceId}`);
    return response.data;
  },

  getGrowthAnalytics: async () => {
    const response = await api.get('/tenants/growth-analytics');
    return response.data;
  },

  getActiveBroadcasts: async () => {
    const response = await api.get('/tenants/active-broadcasts');
    return response.data;
  },

  getAllBroadcasts: async () => {
    const response = await api.get('/tenants/broadcasts');
    return response.data;
  },

  createBroadcast: async (data) => {
    const response = await api.post('/tenants/broadcasts', data);
    return response.data;
  },

  updateBroadcast: async (id, data) => {
    const response = await api.put(`/tenants/broadcasts/${id}`, data);
    return response.data;
  },

  deleteBroadcast: async (id) => {
    const response = await api.delete(`/tenants/broadcasts/${id}`);
    return response.data;
  },

  getPlatformAuditLogs: async (params) => {
    const response = await api.get('/tenants/platform-audit-logs', { params });
    return response.data;
  },

  getSystemHealthDiagnostics: async () => {
    const response = await api.get('/tenants/system-health');
    return response.data;
  },

  getBackupArchives: async () => {
    const response = await api.get('/tenants/backups/archives');
    return response.data;
  },

  triggerAllTenantBackups: async () => {
    const response = await api.post('/tenants/backups/trigger-all');
    return response.data;
  }
};


