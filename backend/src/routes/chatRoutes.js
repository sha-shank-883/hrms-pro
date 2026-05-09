const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Validation rules
const messageValidation = [
  body('receiver_id').isInt().withMessage('Valid receiver ID is required'),
  body('message').notEmpty().withMessage('Message is required'),
];

// Routes
router.get('/messages', authenticateToken, chatController.getMessages);
router.get('/conversations', authenticateToken, chatController.getConversations);
router.get('/unread-count', authenticateToken, chatController.getUnreadCount);
router.post('/messages', authenticateToken, messageValidation, validate, chatController.sendMessage);
router.post('/messages/reaction', authenticateToken, chatController.addReaction);
router.put('/messages/read', authenticateToken, chatController.markAsRead);
router.delete('/messages/:id', authenticateToken, chatController.deleteMessage);
router.delete('/conversations/:userId', authenticateToken, chatController.deleteConversation);

router.post('/channels', authenticateToken, chatController.createChannel);
router.get('/channels', authenticateToken, chatController.getChannels);
router.post('/channels/:id/join', authenticateToken, chatController.joinChannel);
router.get('/channels/:id/messages', authenticateToken, chatController.getChannelMessages);

module.exports = router;
