import api from './api';

export const paymentService = {
  // Get available plans (public)
  getPlans: async () => {
    const response = await api.get('/payments/plans');
    return response.data;
  },

  // Create a PayPal order for a plan (supports USD / INR, seats quantity, cycle, autoPay)
  createOrder: async (planId, currency = 'USD', seats = 10, billingCycle = 'monthly', autoPay = false) => {
    const response = await api.post('/payments/paypal/create-order', { planId, currency, seats, billingCycle, autoPay });
    return response.data;
  },

  // Capture (finalize) a PayPal order after user approval
  captureOrder: async (orderId, planId, currency = 'USD', seats = 10, billingCycle = 'monthly', autoPay = false, isAddon = false, mode = 'renew_plan') => {
    const response = await api.post('/payments/paypal/capture-order', {
      orderId,
      planId,
      currency,
      seats,
      billingCycle,
      autoPay,
      isAddon,
      mode
    });
    return response.data;
  },

  // Razorpay Integration (India Payments - UPI, Cards, NetBanking)
  getRazorpayKey: async () => {
    const response = await api.get('/payments/razorpay/key');
    return response.data;
  },

  createRazorpayOrder: async (planId, seats = 10, billingCycle = 'monthly', autoPay = false) => {
    const response = await api.post('/payments/razorpay/create-order', { planId, seats, billingCycle, autoPay });
    return response.data;
  },

  verifyRazorpayPayment: async (verificationData) => {
    const response = await api.post('/payments/razorpay/verify-payment', verificationData);
    return response.data;
  },

  // Get current subscription status
  getSubscription: async () => {
    const response = await api.get('/payments/subscription');
    return response.data;
  },
};
