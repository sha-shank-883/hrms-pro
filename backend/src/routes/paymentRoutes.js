const express = require('express');
const router = express.Router();
const { getPlans, createOrder, captureOrder, getSubscription } = require('../controllers/paypalController');
const { getRazorpayKey, createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/razorpayController');
const { 
  getPaymentHistory, 
  getLastSubscription, 
  processRefund, 
  requestRefund,
  manualGrantSubscription,
  activateFreeCouponSubscription
} = require('../controllers/paymentManagementController');
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');
const { authenticateToken } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Public: list available plans
router.get('/plans', getPlans);

// Protected: PayPal checkout flow (requires auth + tenant context)
router.post('/paypal/create-order', authenticateToken, tenantMiddleware, createOrder);
router.post('/paypal/capture-order', authenticateToken, tenantMiddleware, captureOrder);

// Protected: Razorpay checkout flow (UPI, Cards, NetBanking for India)
router.get('/razorpay/key', authenticateToken, getRazorpayKey);
router.post('/razorpay/create-order', authenticateToken, tenantMiddleware, createRazorpayOrder);
router.post('/razorpay/verify-payment', authenticateToken, tenantMiddleware, verifyRazorpayPayment);

// Protected: get current subscription status
router.get('/subscription', authenticateToken, tenantMiddleware, getSubscription);

// Protected: payment & transaction history
router.get('/history', authenticateToken, tenantMiddleware, getPaymentHistory);

// Protected: last subscription summary
router.get('/last-subscription', authenticateToken, tenantMiddleware, getLastSubscription);

// Protected: process refund (Super Admin only)
router.post('/refund', authenticateToken, processRefund);

// Protected: tenant refund request
router.post('/request-refund', authenticateToken, tenantMiddleware, requestRefund);

// Protected: Super Admin manual subscription allotment / gift / cash grant
router.post('/manual-grant', authenticateToken, manualGrantSubscription);

// Protected: Promo & Gift Coupons Management
router.get('/coupons', authenticateToken, getCoupons);
router.post('/coupons', authenticateToken, createCoupon);
router.put('/coupons/:id', authenticateToken, updateCoupon);
router.delete('/coupons/:id', authenticateToken, deleteCoupon);
router.post('/coupons/validate', authenticateToken, tenantMiddleware, validateCoupon);
router.post('/coupons/activate-free', authenticateToken, tenantMiddleware, activateFreeCouponSubscription);

module.exports = router;
