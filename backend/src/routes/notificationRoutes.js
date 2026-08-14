const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getModuleBadgeCounts,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(authenticateToken);

router.get('/badge-counts', getModuleBadgeCounts);
router.get('/', getUserNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);

// Tenant Notification Preferences
router.get('/settings', getNotificationSettings);
router.put('/settings', authorizeRole('admin', 'super_admin'), updateNotificationSettings);

module.exports = router;
