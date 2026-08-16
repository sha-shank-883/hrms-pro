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

  createRazorpayOrder: async (planId, seats = 10, billingCycle = 'monthly', autoPay = false, isAddon = false, couponCode = null) => {
    const response = await api.post('/payments/razorpay/create-order', { planId, seats, billingCycle, autoPay, isAddon, couponCode });
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

  // Get tenant or global payment & transaction history
  getHistory: async (tenantId) => {
    const params = tenantId ? { tenantId } : {};
    const response = await api.get('/payments/history', { params });
    return response.data;
  },

  // Get last subscription overview
  getLastSubscription: async (tenantId) => {
    const params = tenantId ? { tenantId } : {};
    const response = await api.get('/payments/last-subscription', { params });
    return response.data;
  },

  // Process refund (Super Admin only)
  processRefund: async (refundData) => {
    const response = await api.post('/payments/refund', refundData);
    return response.data;
  },

  // Tenant Admin: Request a refund
  requestRefund: async (data) => {
    const response = await api.post('/payments/request-refund', data);
    return response.data;
  },

  // Super Admin: Manually grant/gift a subscription plan to any tenant (Cash, Gift, Bank Wire, VIP Offer)
  manualGrantSubscription: async (grantData) => {
    const response = await api.post('/payments/manual-grant', grantData);
    return response.data;
  },

  // Super Admin: Promo & Gift Coupons Management
  getCoupons: async () => {
    const response = await api.get('/payments/coupons');
    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await api.post('/payments/coupons', couponData);
    return response.data;
  },

  updateCoupon: async (id, updateData) => {
    const response = await api.put(`/payments/coupons/${id}`, updateData);
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await api.delete(`/payments/coupons/${id}`);
    return response.data;
  },

  // Tenant Checkout: Validate Promo or Gift Coupon
  validateCoupon: async (validationData) => {
    const response = await api.post('/payments/coupons/validate', validationData);
    return response.data;
  },

  // Tenant Checkout: Activate 100% Free Gift Voucher Plan
  activateFreeCoupon: async (activationData) => {
    const response = await api.post('/payments/coupons/activate-free', activationData);
    return response.data;
  }
};
