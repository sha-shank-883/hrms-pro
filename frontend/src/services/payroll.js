import api from './api';

export const payrollService = {
  getAll: async (params) => {
    const response = await api.get('/payroll', { params });
    return response.data;
  },

  getStatistics: async (params = {}) => {
    const response = await api.get('/payroll/statistics', { params });
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
  },

  create: async (data) => {
    const response = await api.post('/payroll', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/payroll/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/payroll/${id}`);
    return response.data;
  },

  generateAutomatic: async (data) => {
    const response = await api.post('/payroll/generate', data);
    return response.data;
  },

  generateBulk: async (data) => {
    const response = await api.post('/payroll/generate-bulk', data);
    return response.data;
  },

  getRuns: async (params) => {
    const response = await api.get('/payroll-runs', { params });
    return response.data;
  },

  getRun: async (id) => {
    const response = await api.get(`/payroll-runs/${id}`);
    return response.data;
  },

  createRun: async (data) => {
    const response = await api.post('/payroll-runs', data);
    return response.data;
  },

  finalizeRun: async (id) => {
    const response = await api.put(`/payroll-runs/${id}/finalize`);
    return response.data;
  },

  payRun: async (id) => {
    const response = await api.put(`/payroll-runs/${id}/pay`);
    return response.data;
  },

  archiveRun: async (id) => {
    const response = await api.put(`/payroll-runs/${id}/archive`);
    return response.data;
  },

  deleteRun: async (id) => {
    const response = await api.delete(`/payroll-runs/${id}`);
    return response.data;
  },

  getTemplates: async () => {
    const response = await api.get('/payslip-templates');
    return response.data;
  },

  getTemplate: async (id) => {
    const response = await api.get(`/payslip-templates/${id}`);
    return response.data;
  },

  createTemplate: async (data) => {
    const response = await api.post('/payslip-templates', data);
    return response.data;
  },

  updateTemplate: async (id, data) => {
    const response = await api.put(`/payslip-templates/${id}`, data);
    return response.data;
  },

  setDefaultTemplate: async (id) => {
    const response = await api.put(`/payslip-templates/${id}/set-default`);
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await api.delete(`/payslip-templates/${id}`);
    return response.data;
  },

  previewTemplate: async (id) => {
    try {
      const response = await api.get(`/payslip-templates/${id}/preview`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Preview failed';
      throw new Error(msg);
    }
  },

  getPayslipsV2: async (params) => {
    const response = await api.get('/payslips', { params });
    return response.data;
  },

  getPayslipV2: async (id) => {
    const response = await api.get(`/payslips/${id}`);
    return response.data;
  },

  generatePayslip: async (data) => {
    const response = await api.post('/payslips/generate', data);
    return response.data;
  },

  generateBulkPayslips: async (data) => {
    const response = await api.post('/payslips/generate-bulk', data);
    return response.data;
  },

  downloadPayslipPdf: async (id) => {
    const response = await api.get(`/payslips/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  queuePayslipEmail: async (id) => {
    const response = await api.post(`/payslips/${id}/email`);
    return response.data;
  },

  verifyPayslip: async (id) => {
    const response = await api.get(`/payslips/${id}/verify`);
    return response.data;
  },

  getEmailQueue: async (params) => {
    const response = await api.get('/email-queue', { params });
    return response.data;
  },

  getEmailQueueStats: async () => {
    const response = await api.get('/email-queue/stats');
    return response.data;
  },

  retryEmail: async (id) => {
    const response = await api.post(`/email-queue/${id}/retry`);
    return response.data;
  },

  cancelEmail: async (id) => {
    const response = await api.delete(`/email-queue/${id}`);
    return response.data;
  },

  exportPayslips: async (params) => {
    const response = await api.get('/export/payslips', { params, responseType: 'blob' });
    return response.data;
  },

  exportRuns: async (params) => {
    const response = await api.get('/export/runs', { params, responseType: 'blob' });
    return response.data;
  },

  exportEarnings: async (runId) => {
    const response = await api.get('/export/earnings', { params: { run_id: runId }, responseType: 'blob' });
    return response.data;
  }
};
