const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLogger');
const emailQueueController = require('../controllers/emailQueueController');

const router = express.Router();

router.get('/stats', authenticateToken, authorizeRole('admin'), emailQueueController.getQueueStats);
router.get('/', authenticateToken, authorizeRole('admin'), emailQueueController.listQueue);
router.post('/:id/retry', authenticateToken, authorizeRole('admin'), logAction('RETRY_EMAIL', 'EMAIL'), emailQueueController.retryQueueItem);
router.delete('/:id', authenticateToken, authorizeRole('admin'), logAction('CANCEL_EMAIL', 'EMAIL'), emailQueueController.cancelQueueItem);

module.exports = router;
