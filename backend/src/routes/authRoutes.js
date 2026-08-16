const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLogger');
const { 
  authRateLimiter, 
  signupRateLimiter, 
  verifyBotChallenge 
} = require('../middleware/securityGuards');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const adminChangePasswordValidation = [
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Public Cryptographic Bot Challenge Endpoint
router.get('/challenge', authController.getChallengeToken);

// Routes
router.post('/signup', signupRateLimiter, verifyBotChallenge, authController.signupCompany);
router.post('/register-company', signupRateLimiter, verifyBotChallenge, authController.signupCompany);
router.post('/register', signupRateLimiter, registerValidation, validate, authController.register);
router.post('/login', authRateLimiter, verifyBotChallenge, loginValidation, validate, logAction('LOGIN', 'USER'), authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, logAction('UPDATE_PROFILE', 'USER'), authController.updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, validate, logAction('CHANGE_PASSWORD', 'USER'), authController.changePassword);
router.put('/change-password/:userId', authenticateToken, adminChangePasswordValidation, validate, logAction('ADMIN_CHANGE_PASSWORD', 'USER'), authController.adminChangeUserPassword);
router.put('/permissions/:userId', authenticateToken, logAction('ADMIN_UPDATE_PERMISSIONS', 'USER'), authController.adminUpdatePermissions);
router.post('/forgot-password', authRateLimiter, body('email').isEmail().withMessage('Valid email is required').normalizeEmail(), validate, authController.forgotPassword);
router.post('/reset-password/:token', authRateLimiter, authController.resetPassword);

// 2FA Routes
router.post('/2fa/setup', authenticateToken, authController.setup2FA);
router.post('/2fa/verify-setup', authenticateToken, authController.verify2FASetup);
router.post('/2fa/verify-login', authRateLimiter, authController.verify2FALogin);
router.post('/2fa/disable', authenticateToken, authController.disable2FA);

module.exports = router;
