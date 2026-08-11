const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { CHAT, FAQ, TICKET, AI, ADMIN, CANNED } = require('../controllers/supportController');

// === CHAT Routes ===
router.post('/chat/start', authenticateToken, CHAT.createOrGetChat);
router.get('/chat/history/:chatId', authenticateToken, CHAT.getChatHistory);
router.get('/chat/my', authenticateToken, CHAT.getMyChats);
router.put('/chat/:chatId/close', authenticateToken, CHAT.closeChat);
router.put('/chat/:chatId/resolve', authenticateToken, authorizeRole('admin', 'manager'), CHAT.resolveChat);

// === FAQ Routes ===
router.get('/faq', authenticateToken, FAQ.list);
router.get('/faq/categories', authenticateToken, FAQ.categories);
router.get('/faq/:id', authenticateToken, FAQ.getById);
router.post('/faq', authenticateToken, authorizeRole('admin', 'manager'), [
  body('question').notEmpty().trim(),
  body('answer').notEmpty().trim(),
  body('category_id').isInt()
], validate, FAQ.create);
router.put('/faq/:id', authenticateToken, authorizeRole('admin', 'manager'), FAQ.update);
router.delete('/faq/:id', authenticateToken, authorizeRole('admin', 'manager'), FAQ.remove);
router.post('/faq/:id/feedback', authenticateToken, FAQ.feedback);

// FAQ Category routes
router.post('/faq/categories', authenticateToken, authorizeRole('admin', 'manager'), [
  body('name').notEmpty().trim(),
  body('slug').notEmpty().trim()
], validate, FAQ.createCategory);
router.put('/faq/categories/:id', authenticateToken, authorizeRole('admin', 'manager'), FAQ.updateCategory);
router.delete('/faq/categories/:id', authenticateToken, authorizeRole('admin', 'manager'), FAQ.deleteCategory);

// === Ticket Routes ===
router.get('/tickets', authenticateToken, TICKET.list);
router.get('/tickets/stats', authenticateToken, authorizeRole('admin', 'manager'), TICKET.stats);
router.get('/tickets/:id', authenticateToken, TICKET.getById);
router.post('/tickets', authenticateToken, [
  body('subject').notEmpty().trim()
], validate, TICKET.create);
router.put('/tickets/:id/status', authenticateToken, authorizeRole('admin', 'manager'), TICKET.updateStatus);
router.put('/tickets/:id/assign', authenticateToken, authorizeRole('admin', 'manager'), TICKET.assign);

// Ticket Comments
router.post('/tickets/:id/comments', authenticateToken, [
  body('comment').notEmpty().trim()
], validate, TICKET.addComment);

// === AI Routes ===
router.post('/ai/ask', authenticateToken, [
  body('message').notEmpty().trim()
], validate, AI.ask);

// === Admin Dashboard Routes ===
router.get('/admin/chats', authenticateToken, authorizeRole('admin', 'manager'), ADMIN.getActiveChats);
router.get('/admin/dashboard', authenticateToken, authorizeRole('admin', 'manager'), ADMIN.getDashboard);
router.get('/admin/agents', authenticateToken, authorizeRole('admin', 'manager'), ADMIN.getAgents);
router.post('/admin/agents', authenticateToken, authorizeRole('admin'), [
  body('user_id').isInt()
], validate, ADMIN.addAgent);
router.put('/admin/agents/:id', authenticateToken, authorizeRole('admin', 'manager'), ADMIN.updateAgent);
router.delete('/admin/agents/:id', authenticateToken, authorizeRole('admin'), ADMIN.removeAgent);

// === Canned Replies Routes ===
router.get('/canned-replies', authenticateToken, authorizeRole('admin', 'manager'), CANNED.list);
router.post('/canned-replies', authenticateToken, authorizeRole('admin', 'manager'), [
  body('title').notEmpty().trim(),
  body('content').notEmpty().trim()
], validate, CANNED.create);
router.put('/canned-replies/:id', authenticateToken, authorizeRole('admin', 'manager'), CANNED.update);
router.delete('/canned-replies/:id', authenticateToken, authorizeRole('admin', 'manager'), CANNED.remove);

module.exports = router;
